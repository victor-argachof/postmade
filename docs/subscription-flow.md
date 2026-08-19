# Fluxo de avaliação e assinatura

Este documento descreve o modelo de assinatura configurável do Postmade e serve
como referência para a futura implementação do back-end e da Stripe.

## Conceitos

Existe um único plano pago, associado ao workspace. Todos os assinantes possuem os
mesmos recursos; apenas as quantidades de canais e membros variam.

```ts
interface WorkspaceSubscriptionConfiguration {
  channels: number;
  members: number;
}

type SubscriptionStatus =
  "trialing" | "active" | "past_due" | "canceled" | "expired";
```

- A assinatura, sua configuração e cobrança pertencem ao workspace.
- O proprietário conta como um membro e é o único que pode gerenciar a cobrança.
- Convites pendentes também ocupam vagas de membros.
- Somente canais com `connected: true` consomem a cota contratada.
- Posts são ilimitados após a contratação.

## Preço e quantidades

A mensalidade-base inclui 3 canais e 1 membro:

| Item mensal      |    USD |   BRL |
| ---------------- | -----: | ----: |
| Base             | US$ 19 | R$ 99 |
| Canal adicional  |  US$ 2 | R$ 10 |
| Membro adicional |  US$ 8 | R$ 40 |

O configurador aceita entre 3 e 500 canais e entre 1 e 100 membros. Os valores
representam o total contratado, não apenas os adicionais.

```text
mensal = base
       + (canais - 3) × preço por canal
       + (membros - 1) × preço por membro
```

A assinatura possui somente cobrança mensal. Os preços do front-end são apenas
uma previsão; valores, moeda, impostos e total retornados pelo back-end e pela
Stripe prevalecem.

Constantes, normalização e cálculo ficam centralizados em
`features/workspaces/lib/subscription-pricing.ts`. Componentes não devem duplicar
preços, franquias ou máximos.

## Avaliação gratuita

Todo workspace novo começa com:

```ts
{
  subscriptionConfiguration: { channels: 3, members: 1 },
  subscriptionStatus: "trialing"
}
```

A avaliação dura 15 dias e permite 3 posts, 3 canais e somente o proprietário.
Os limites temporários prevalecem sobre a configuração enquanto o status for
`trialing`.

No ambiente de desenvolvimento, a aplicação também disponibiliza de forma
idempotente o workspace demonstrativo `Postmade Studio`, com assinatura ativa,
8 canais e 3 membros contratados. Esse dado existe apenas para revisão visual e
não é incluído no build de produção.

O usuário configura canais e membros antes de iniciar o checkout. Essa
escolha não ativa a assinatura nem altera as cotas persistidas localmente.

## Contratação e alterações

O checkout recebe:

```ts
{
  workspaceId: string;
  channelQuantity: number;
  memberQuantity: number;
}
```

Fluxo esperado:

```text
trialing/canceled/expired
        |
        | checkout criado com as quantidades
        v
aguardando confirmação externa
        |
        | webhook confirma pagamento
        v
active + configuração contratada
```

O retorno do navegador não ativa a assinatura. O back-end atualiza status,
quantidades e dados de cobrança de forma atômica após um evento confiável.

Assinaturas `active` podem alterar canais e membros pelo configurador do Postmade.
O front-end limita os campos pelo uso atual e apresenta uma confirmação, mas essa
checagem é apenas uma conveniência de interface. Quando o usuário tenta diminuir
uma quantidade que já está no mínimo permitido,
o controle usa `aria-disabled` e abre uma explicação contextual sem alterar o
valor. O modal diferencia o mínimo contratual do bloqueio por uso e, no segundo
caso, direciona para o gerenciamento de canais ou membros.

Ao receber a solicitação, o back-end deve, dentro de uma transação:

1. carregar o workspace e confirmar que o ator é o proprietário;
2. contar novamente canais com `connected: true`;
3. contar proprietário, demais membros e convites pendentes;
4. rejeitar quantidades abaixo do uso ou fora dos mínimos e máximos;
5. calcular a prorrata e atualizar os itens correspondentes na Stripe;
6. registrar a solicitação de forma idempotente.

Se algum recurso for conectado, membro adicionado ou convite criado entre a
abertura da tela e a confirmação, a leitura transacional prevalece e a redução é
rejeitada. As cotas persistidas só mudam após webhook válido. Assinaturas
`past_due` devem regularizar o pagamento no portal Stripe antes de solicitar
alterações. O portal permanece responsável por pagamento, faturas e cancelamento.

## Exclusão de conta

A exclusão considera somente as assinaturas dos workspaces pertencentes ao
usuário. Uma assinatura `active` que ainda pode renovar bloqueia a operação e
deve ser cancelada primeiro no portal Stripe. Assinaturas `past_due` também
bloqueiam a exclusão até sua regularização ou seu encerramento.

Uma assinatura `active` com `cancelAtPeriodEnd: true` não bloqueia a exclusão,
pois sua renovação já está desativada. A interface informa que a exclusão remove
o acesso imediatamente, abre mão do período pago restante e não gera reembolso
automático. Ao concluir a operação, o back-end deve encerrar a assinatura no
provedor para não mantê-la vinculada a uma conta ou workspace inexistente.

## Perguntas frequentes

A página de assinatura encerra com uma seção de perguntas frequentes em
accordions. O conteúdo explica o cálculo do preço, a avaliação gratuita, o uso
de membros e alterações e reduções de quantidade. Perguntas e
respostas pertencem ao namespace `subscription` e devem permanecer traduzidas em
português e inglês.

## Status

| Status     | Significado                                                                          |
| ---------- | ------------------------------------------------------------------------------------ |
| `trialing` | Avaliação gratuita em andamento.                                                     |
| `active`   | Assinatura contratada e válida.                                                      |
| `past_due` | Existe uma cobrança vencida ou com falha.                                            |
| `canceled` | Assinatura encerrada; a última configuração é preservada para exibição.              |
| `expired`  | Avaliação terminada sem contratação; a configuração pode ser redefinida no checkout. |

O comportamento geral de acesso em `past_due`, `canceled` e `expired` permanece
separado do cálculo das quantidades e deverá ser aplicado pelo back-end.

## Persistência local

O modelo configurável utiliza `postmade.workspaces.v2`. Estados locais `v1`, que
continham a estrutura anterior de planos, são descartados sem migração. A autenticação é
preservada; ao autenticar novamente, o usuário recebe um workspace novo em
avaliação quando não existir um workspace válido no formato atual.

## Responsabilidades do back-end

O back-end deverá:

1. Persistir status, quantidades, datas e dados de cobrança por workspace.
2. Validar mínimos, máximos, limites do trial e uso atual no servidor.
3. Restringir checkout, atualizações e portal ao proprietário.
4. Calcular e confirmar preços na moeda correta, sem confiar no preview do cliente.
5. Criar checkout com as quantidades totais e associá-lo ao workspace correto.
6. Configurar alterações com prorrata e impedir reduções abaixo do uso.
7. Processar webhooks de forma idempotente e atualizar cotas atomicamente.
8. Expirar avaliações e registrar alterações para auditoria.

Campos recomendados:

```ts
interface WorkspaceSubscription {
  workspaceId: string;
  configuration: WorkspaceSubscriptionConfiguration;
  status: SubscriptionStatus;
  trialStartedAt: string;
  trialEndsAt: string;
  currentPeriodStartedAt: string | null;
  currentPeriodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
}
```

Identificadores externos e eventos de pagamento não devem ser controlados apenas
pelo front-end.

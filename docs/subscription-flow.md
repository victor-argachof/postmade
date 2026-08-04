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
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";
```

- A assinatura, sua configuração e cobrança pertencem ao workspace.
- O proprietário conta como um membro e é o único que pode gerenciar a cobrança.
- Convites pendentes também ocupam vagas de membros.
- Somente canais com `connected: true` consomem a cota contratada.
- Posts são ilimitados após a contratação.

## Preço e quantidades

A mensalidade-base inclui 3 canais e 1 membro:

| Item mensal | USD | BRL |
| --- | ---: | ---: |
| Base | US$ 19 | R$ 99 |
| Canal adicional | US$ 2 | R$ 10 |
| Membro adicional | US$ 8 | R$ 40 |

O configurador aceita entre 3 e 500 canais e entre 1 e 100 membros. Os valores
representam o total contratado, não apenas os adicionais.

```text
mensal = base
       + (canais - 3) × preço por canal
       + (membros - 1) × preço por membro

anual = mensal × 10
```

O ciclo anual equivale a dez mensalidades e concede dois meses grátis. Os preços
do front-end são apenas uma previsão; valores, moeda, impostos e total retornados
pelo back-end e pela Stripe prevalecem.

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

O usuário configura canais, membros e ciclo antes de iniciar o checkout. Essa
escolha não ativa a assinatura nem altera as cotas persistidas localmente.

## Contratação e alterações

O checkout recebe:

```ts
{
  workspaceId: string;
  billingCycle: "monthly" | "annual";
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

Assinaturas `active` ou `past_due` exibem as quantidades vigentes como somente
leitura e direcionam mudanças ao portal Stripe. O portal aplica prorrata. Uma
redução é bloqueada enquanto canais conectados, membros ou convites pendentes
excederem a nova configuração; as cotas só mudam após webhook válido.

## Perguntas frequentes

A página de assinatura encerra com uma seção de perguntas frequentes em
accordions. O conteúdo explica o cálculo do preço, a avaliação gratuita, o uso
de membros, alterações e reduções de quantidade e a cobrança anual. Perguntas e
respostas pertencem ao namespace `subscription` e devem permanecer traduzidas em
português e inglês.

## Status

| Status | Significado |
| --- | --- |
| `trialing` | Avaliação gratuita em andamento. |
| `active` | Assinatura contratada e válida. |
| `past_due` | Existe uma cobrança vencida ou com falha. |
| `canceled` | Assinatura encerrada; a última configuração é preservada para exibição. |
| `expired` | Avaliação terminada sem contratação; a configuração pode ser redefinida no checkout. |

O comportamento geral de acesso em `past_due`, `canceled` e `expired` permanece
separado do cálculo das quantidades e deverá ser aplicado pelo back-end.

## Persistência local

O modelo configurável utiliza `postmade.workspaces.v2`. Estados locais `v1`, que
continham a estrutura anterior de planos, são descartados sem migração. A autenticação é
preservada; ao autenticar novamente, o usuário recebe um workspace novo em
avaliação quando não existir um workspace válido no formato atual.

## Responsabilidades do back-end

O back-end deverá:

1. Persistir status, quantidades, ciclo, datas e dados de cobrança por workspace.
2. Validar mínimos, máximos, limites do trial e uso atual no servidor.
3. Restringir checkout e portal ao proprietário.
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
  cycle: BillingCycle | null;
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

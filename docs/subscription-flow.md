# Fluxo de avaliação e assinatura

Este documento descreve as regras atuais de planos e assinaturas e serve como referência inicial para a implementação do back-end.

## Conceitos

Plano e status da assinatura são informações independentes:

```ts
type WorkspacePlan = "creator" | "growth" | "pro";

type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";
```

- `plan` define os recursos e limites do workspace.
- `subscriptionStatus` representa a situação comercial da assinatura.
- A assinatura pertence ao workspace, não diretamente ao usuário.
- Somente o proprietário do workspace pode alterar o plano ou gerenciar a cobrança.

## Planos e limites

| Plano | Membros | Canais | Posts |
| --- | ---: | ---: | --- |
| Creator | 1 | 15 | Ilimitados |
| Growth | 5 | 50 | Ilimitados |
| Pro | 15 | Ilimitados | Ilimitados |

Durante a avaliação gratuita, os limites temporários de posts e canais substituem os limites do plano:

| Recurso | Limite durante a avaliação |
| --- | ---: |
| Duração | 15 dias |
| Posts | 3 |
| Canais | 3 |
| Membros | Conforme o plano selecionado |

Exemplos:

- Creator em avaliação: 1 membro, 3 canais e 3 posts.
- Growth em avaliação: 5 membros, 3 canais e 3 posts.
- Pro em avaliação: 15 membros, 3 canais e 3 posts.

## Criação do workspace

Na implementação atual, todo novo workspace começa com:

```ts
{
  plan: "creator",
  subscriptionStatus: "trialing"
}
```

O período de avaliação começa na criação do workspace e termina 15 dias depois.

No fluxo futuro, a landing page poderá enviar o plano escolhido como parâmetro da URL. O back-end deverá:

1. Validar se o valor recebido corresponde a `creator`, `growth` ou `pro`.
2. Usar o plano recebido quando ele for válido.
3. Usar `creator` quando o parâmetro estiver ausente ou for inválido.
4. Criar o workspace com status `trialing`.

O parâmetro de URL é apenas uma intenção do usuário. O back-end deve validar e persistir o plano; o front-end não deve ser a fonte de verdade.

## Alteração de plano durante a avaliação

O proprietário pode trocar entre Creator, Growth e Pro durante a avaliação.

A troca modifica somente `plan`. Ela não encerra nem reinicia o período de avaliação:

```text
Creator + trialing
        |
        | troca de plano
        v
Growth + trialing
```

As datas `trialStartedAt` e `trialEndsAt` devem permanecer inalteradas. Os novos limites entram em vigor imediatamente.

Uma redução para Creator deve ser recusada enquanto o workspace possuir mais de um membro ou convite pendente.

## Contratação

A seleção de um plano durante a avaliação não deve ativar a assinatura. A ativação deve ocorrer somente após a confirmação do provedor de pagamentos.

Fluxo esperado:

```text
trialing
   |
   | checkout criado
   v
aguardando confirmação externa
   |
   | pagamento confirmado
   v
active
```

O back-end deve ser a fonte de verdade para a ativação. O retorno do navegador após o checkout não é suficiente para marcar uma assinatura como ativa.

## Status

| Status | Significado |
| --- | --- |
| `trialing` | Avaliação gratuita em andamento. |
| `active` | Assinatura contratada e válida. |
| `past_due` | Existe uma cobrança vencida ou com falha de pagamento. |
| `canceled` | A assinatura foi cancelada. |
| `expired` | A avaliação terminou sem uma assinatura ativa. |

Transições principais:

```text
trialing ── pagamento confirmado ──> active
trialing ── fim da avaliação ──────> expired
active ─── falha de pagamento ────> past_due
past_due ─ pagamento confirmado ──> active
active ─── cancelamento ──────────> canceled
past_due ─ cancelamento ──────────> canceled
canceled ─ nova contratação ─────> active
expired ── nova contratação ─────> active
```

As regras de acesso durante `past_due` e após o cancelamento devem ser definidas antes da integração. Caso exista acesso até o fim do período pago, o modelo deverá armazenar `currentPeriodEndsAt` e diferenciar cancelamento agendado de assinatura já encerrada.

## Comportamento atual da interface

- O plano atual é exibido separadamente do status.
- O badge de avaliação aparece no seletor de workspace somente para `trialing`.
- A página de assinatura apresenta status, uso e limites do workspace.
- Recursos ilimitados são identificados como `Ilimitado`.
- O card de contratação aparece para `trialing`, `canceled` e `expired`.
- O card de contratação fica oculto para `active` e `past_due`.
- A troca de plano no front-end preserva o status atual.

## Responsabilidades do back-end

O back-end deverá:

1. Persistir plano, status, datas da avaliação e períodos de cobrança por workspace.
2. Validar limites no servidor antes de criar posts, conectar canais ou adicionar membros.
3. Restringir operações de cobrança ao proprietário do workspace.
4. Criar sessões de checkout e associá-las ao workspace correto.
5. Processar webhooks do provedor de pagamentos de forma idempotente.
6. Atualizar o status somente a partir de eventos confiáveis do provedor.
7. Expirar avaliações vencidas por rotina agendada ou durante a validação de acesso.
8. Registrar alterações de plano e status para auditoria.
9. Impedir downgrade quando o uso atual exceder os limites do plano de destino.

Campos recomendados para a assinatura:

```ts
interface WorkspaceSubscription {
  workspaceId: string;
  plan: WorkspacePlan;
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

Os identificadores externos e eventos de pagamento não devem ser armazenados ou controlados apenas pelo front-end.

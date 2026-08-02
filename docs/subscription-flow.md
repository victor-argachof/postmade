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

- `plan` define os recursos disponíveis no workspace e, fora da avaliação, seus limites quantitativos.
- `subscriptionStatus` representa a situação comercial da assinatura.
- A assinatura pertence ao workspace, não diretamente ao usuário.
- Somente o proprietário do workspace pode alterar o plano ou gerenciar a cobrança.

Durante a avaliação gratuita, todo workspace utiliza `plan: "pro"`. Isso libera o conjunto completo de recursos do Pro, inclusive funcionalidades adicionadas futuramente, enquanto limites temporários controlam apenas as quantidades permitidas.

## Planos e limites

| Plano | Membros | Canais | Posts |
| --- | ---: | ---: | --- |
| Creator | 1 | 15 | Ilimitados |
| Growth | 5 | 50 | Ilimitados |
| Pro | 15 | Ilimitados | Ilimitados |

Durante a avaliação gratuita, os limites temporários substituem os limites quantitativos do Pro:

| Recurso | Limite durante a avaliação |
| --- | ---: |
| Duração | 15 dias |
| Posts | 3 |
| Canais | 3 |
| Membros | 1 (somente o proprietário) |

Assim, `Pro + trialing` significa:

- acesso a todos os recursos disponíveis no Pro;
- até 3 posts;
- até 3 canais;
- somente o proprietário como membro do workspace.

Recursos e quantidades devem ser avaliados separadamente. Por exemplo, um futuro estúdio de edição exclusivo do Pro ficará disponível durante a avaliação, mas a quantidade de posts continuará limitada a 3.

No front-end, o limite de canais deve ser obtido por
`getWorkspaceChannelLimit(plan, subscriptionStatus)`. Esse helper concentra a
precedência do limite temporário da avaliação sobre o limite do plano e retorna
`null` para o Pro ilimitado. Componentes de canais e assinatura não devem repetir
essa regra ou seus valores numéricos. Consulte também
[Gerenciamento de canais sociais](channels-management.md).

## Criação do workspace

Todo novo workspace começa com:

```ts
{
  plan: "pro",
  subscriptionStatus: "trialing"
}
```

O período de avaliação começa na criação do workspace e termina 15 dias depois.

O CTA genérico da landing page e os CTAs específicos dos planos iniciam a mesma avaliação `Pro + trialing`. Um plano selecionado antes do cadastro pode ser registrado como intenção comercial ou dado de aquisição, mas não deve reduzir os recursos da avaliação nem ser tratado como uma contratação.

## Plano durante a avaliação

O plano do workspace não é alterado durante a avaliação. Os cards de preços iniciam diretamente o checkout do plano escolhido e não modificam o estado local antes do pagamento.

```text
Pro + trialing
      |
      | checkout do Growth criado
      v
aguardando confirmação externa
      |
      | webhook confirma pagamento
      v
Growth + active
```

Como a avaliação permite no máximo 3 canais e 1 membro, o usuário pode contratar Creator, Growth ou Pro sem precisar reduzir o uso antes do checkout.

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

O plano enviado ao checkout representa a escolha definitiva do usuário. Após a confirmação do pagamento, o webhook deve atualizar `plan` e `subscriptionStatus` de forma atômica.

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

- Durante a avaliação, o workspace utiliza os recursos do Pro sem exibir um plano pago como contratado.
- O badge de avaliação aparece no seletor de workspace somente para `trialing`.
- A página de assinatura apresenta status, uso e limites do workspace.
- Recursos ilimitados são identificados como `Ilimitado`.
- O card de contratação aparece para `trialing`, `canceled` e `expired`.
- O card de contratação fica oculto para `active` e `past_due`.
- Durante a avaliação, todos os cards de planos exibem uma ação de contratação e criam checkout sem alterar o plano local.
- Para assinaturas ativas, mudanças de plano ou ciclo são gerenciadas pela Stripe e refletidas por webhook.

## Responsabilidades do back-end

O back-end deverá:

1. Persistir plano, status, datas da avaliação e períodos de cobrança por workspace.
2. Validar no servidor os limites temporários de 3 posts, 3 canais e 1 membro quando o status for `trialing`.
3. Restringir operações de cobrança ao proprietário do workspace.
4. Criar sessões de checkout e associá-las ao workspace correto.
5. Processar webhooks do provedor de pagamentos de forma idempotente.
6. Atualizar o status somente a partir de eventos confiáveis do provedor.
7. Expirar avaliações vencidas por rotina agendada ou durante a validação de acesso.
8. Registrar alterações de plano e status para auditoria.
9. Impedir downgrade quando o uso atual exceder os limites do plano de destino.
10. Separar autorização de recursos, baseada no plano Pro durante a avaliação, de limites quantitativos, baseados no status `trialing`.

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

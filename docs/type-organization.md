# Organização de tipos no front-end

O front-end segue uma arquitetura _feature-first_. Cada feature possui uma pasta
`types/` com um `index.ts`, mesmo quando ainda não existem tipos compartilhados na
feature. O arquivo `index.ts` funciona como ponto de exportação quando a feature
passa a ter tipos públicos.

## Uso do `types/index.ts`

O `types/index.ts` pode conter declarações de tipos e interfaces diretamente. Em
features pequenas, essa é a organização preferida por manter tipos relacionados em
um único arquivo sem criar divisões desnecessárias.

```ts
export interface CalendarEvent {
  id: string;
  title: string;
  scheduledFor: string;
}

export type CalendarView = "month" | "week" | "day";
```

Arquivos nomeados, como `workspace.ts` ou `billing.ts`, devem ser criados quando
o volume de declarações aumentar ou quando existirem grupos conceituais claramente
distintos. Nesse caso, o `index.ts` passa a funcionar como ponto central de
reexportação:

```ts
export type * from "./billing";
export type * from "./workspace";
```

Essa separação também pode ser adotada quando um grupo possuir muitas dependências,
for alterado com frequência ou precisar oferecer imports específicos. A estrutura
deve evoluir conforme a complexidade real da feature, sem exigir um arquivo por
tipo desde o início.

## Localização recomendada

| Tipo                                      | Local recomendado                                             |
| ----------------------------------------- | ------------------------------------------------------------- |
| Props usadas por um componente            | No próprio componente                                         |
| Estado interno de um slice                | No próprio slice                                              |
| Valores inferidos de um schema Zod        | Junto ao schema                                               |
| Tipos usados em vários módulos da feature | `feature/types/`                                              |
| Tipos consumidos por outras features      | API pública da feature ou pacote compartilhado                |
| DTOs/contratos entre front-end e back-end | `packages/types` (que pode evoluir para `packages/contracts`) |

`SocialPlatform` e `SocialChannel` são exemplos de contratos em `packages/types`:
eles são consumidos por workspaces, canais e publicação. O estado dos canais,
porém, pertence a `workspace.resources.channels`; o pacote compartilhado define
o formato dos dados, não uma segunda fonte de estado. As decisões específicas
desse domínio estão registradas em [Gerenciamento de canais sociais](channels-management.md).

## Princípios

- Tipos devem permanecer próximos do código que lhes dá significado.
- `types/` não deve se tornar um depósito para props, estados privados ou tipos
  usados por um único arquivo.
- Uma feature não deve importar tipos a partir do store de outra feature. Tipos
  compartilhados devem ser expostos por `feature/types/`.
- `packages/types` é reservado para contratos compartilhados entre aplicações,
  como DTOs de entrada e saída e modelos que fazem parte da API.
- Regras e valores de negócio não são tipos. Eles devem ficar em módulos como
  `feature/lib/`, mesmo quando operam sobre tipos declarados em `feature/types/`.

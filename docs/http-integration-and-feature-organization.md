# Integração HTTP e organização de features

Este guia define como front-end e back-end devem organizar integrações HTTP no
Postmade. O objetivo é manter responsabilidades claras e evitar regras de negócio,
traduções e detalhes de transporte misturados nos componentes.

## Fluxo de uma requisição

```text
Página ou componente
  → hook da feature, quando necessário
  → service do RTK Query
  → controller da API
  → service do back-end
  → banco ou integração externa
```

As respostas percorrem o caminho inverso. Erros são tratados pelo código estável
retornado pela API, nunca pela leitura da mensagem técnica.

## Front-end

O front-end usa organização _feature-first_:

```text
features/<feature>/
├── components/
├── hooks/
├── i18n/
├── lib/
├── pages/
├── schemas/
├── services/
├── store/
└── types/
```

Crie apenas as pastas necessárias para cada feature.

| Pasta         | Responsabilidade                                                 |
| ------------- | ---------------------------------------------------------------- |
| `components/` | Interface e interação específicas da feature.                    |
| `hooks/`      | Composição reutilizável de queries, mutations, estado e efeitos. |
| `i18n/`       | Textos específicos da feature, separados por idioma.             |
| `lib/`        | Funções puras e regras de domínio sem dependência de React.      |
| `pages/`      | Composição da rota e coordenação dos componentes.                |
| `schemas/`    | Validação local de formulários e entradas, geralmente com Zod.   |
| `services/`   | Declaração dos endpoints remotos com RTK Query.                  |
| `store/`      | Estado exclusivamente cliente que precisa ser compartilhado.     |
| `types/`      | Tipos internos ou públicos da feature.                           |

### O que colocar em `services/`

Um service descreve o contrato HTTP: URL, método, entrada, saída, cache e
invalidação de tags.

```ts
export const workspacesApi = api.injectEndpoints({
  endpoints: (build) => ({
    updateWorkspace: build.mutation<Workspace, UpdateWorkspaceInput>({
      query: ({ id, ...body }) => ({
        url: `/workspaces/${id}`,
        method: "PATCH",
        body,
      }),
    }),
  }),
});
```

Não coloque em `services/`:

- toasts ou textos traduzidos;
- navegação;
- abertura de modais;
- estado visual;
- regras de formulário;
- tratamento específico de apresentação.

Essas decisões pertencem a componentes, páginas ou hooks.

### Quando criar um hook

Crie um hook quando houver comportamento reutilizável ou composição relevante:

- combinar query e mutation;
- coordenar loading, erro e sucesso;
- aplicar uma regra usada por mais de um componente;
- encapsular efeitos da interface.

Não crie um hook que apenas renomeia um hook gerado pelo RTK Query:

```ts
// Evitar: não acrescenta comportamento.
function useWorkspaces() {
  return useListWorkspacesQuery();
}
```

### Estado remoto e estado local

- Dados vindos da API ficam no cache do RTK Query.
- Estado visual simples fica no componente.
- Redux slices são usados para estado cliente compartilhado, não para duplicar o
  cache da API.
- Parâmetros de busca, filtro e paginação compartilháveis por URL devem ficar nos
  search params quando fizer sentido.

## Back-end

Cada módulo NestJS mantém as responsabilidades separadas:

| Arquivo/camada    | Responsabilidade                                              |
| ----------------- | ------------------------------------------------------------- |
| `*.controller.ts` | Rota, status HTTP, DTOs, autenticação e documentação Swagger. |
| `*.service.ts`    | Regras de negócio e coordenação das dependências.             |
| `*.dto.ts`        | Entrada, saída, validação e exemplos do contrato HTTP.        |
| `common/`         | Filtros, guards e contratos transversais.                     |
| `infrastructure/` | Prisma, Redis, e-mail e integrações externas.                 |

Controllers devem ser pequenos. Acesso ao banco e regras de negócio não devem ser
implementados diretamente neles.

### Retorno de erros

Erros explícitos devem usar o helper tipado:

```ts
throw new NotFoundException(
  apiError("WORKSPACE_NOT_FOUND", "Workspace not found")
);
```

Para adicionar um novo erro:

1. adicione o código em `packages/types/src/api/errors.ts`;
2. use `apiError(...)` no back-end;
3. mapeie o código em `apps/web/src/shared/api/api-error.ts`;
4. adicione a mensagem nos dois arquivos `api-errors.json`;
5. cubra comportamentos específicos com testes.

O TypeScript exige que todo `ApiErrorCode` tenha mapeamento no front-end.

## Tratamento de erros no front-end

O front-end usa `getApiErrorTranslationKey(error)` para converter a resposta do
RTK Query em uma chave do namespace `apiErrors`:

```ts
const { t: tApiError } = useTranslation("apiErrors");

try {
  await updateWorkspace(input).unwrap();
} catch (error) {
  toast.error(tApiError(getApiErrorTranslationKey(error)));
}
```

Regras:

- não exibir `ApiError.message` para o usuário;
- não comparar mensagens textuais retornadas pelo back-end;
- código conhecido usa tradução específica;
- código desconhecido usa `unexpected`;
- falha de transporte usa `network`;
- erros de campos usam `details`, com `field`, `code` e `params`.

## Traduções

| Namespace            | Conteúdo                                                  |
| -------------------- | --------------------------------------------------------- |
| `common`             | Textos genéricos realmente compartilhados pela interface. |
| `apiErrors`          | Erros da API, falhas de rede e fallbacks HTTP.            |
| Namespace da feature | Textos, feedbacks e validações locais da feature.         |

Arquivos compartilhados ficam em `shared/i18n/locales/<idioma>/`. Traduções de
uma feature ficam em `features/<feature>/i18n/`.

Ao criar uma chave, adicione-a em inglês e português. Validação local de formulário
pertence ao namespace da feature; erro retornado pela API pertence a `apiErrors`.

## Tipos compartilhados

Contratos usados por mais de uma aplicação ficam em `packages/types/src`,
organizados por domínio. `index.ts` é somente o barrel público.

Consumidores importam sempre pela raiz:

```ts
import type { ApiError, ScheduledPublication } from "@postmade/types";
```

Não use imports profundos para arquivos internos de `packages/types`.

## Checklist de uma integração

- [ ] DTO de entrada e saída definido e validado.
- [ ] Endpoint documentado no Swagger.
- [ ] Regra de negócio implementada no service do back-end.
- [ ] Endpoint declarado no service do RTK Query.
- [ ] Cache e invalidação revisados.
- [ ] Erros usam códigos compartilhados e traduções completas.
- [ ] Loading, vazio, sucesso e erro tratados na interface.
- [ ] Typecheck, lint e testes executados.

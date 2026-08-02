# Postmade

Monorepo do MVP do Postmade, preparado com Turborepo e pnpm.

## Requisitos

- Node.js 20.19 ou superior
- pnpm 10 ou superior (`corepack enable` instala o gerenciador indicado no projeto)

## Desenvolvimento

```bash
corepack enable
pnpm install
pnpm dev
```

O front-end fica disponível em `http://localhost:5173`.

## Verificações

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Estrutura

- `apps/web`: aplicação React/Vite.
- `packages/types`: contratos TypeScript compartilháveis entre aplicações.
- `apps/web/src/features`: módulos de negócio isolados.
- `apps/web/src/shared`: infraestrutura e componentes genéricos.
- `docs`: decisões e convenções de arquitetura do projeto.

A convenção para posicionamento de tipos no front-end está documentada em
[`docs/type-organization.md`](docs/type-organization.md).

As telas de autenticação são somente visuais nesta fase. O botão de acesso cria uma sessão local temporária no Redux para permitir a navegação pelo shell do dashboard.

# Postmade

Monorepo do MVP do **Postmade**, um SaaS de publicação e agendamento de conteúdo
para criadores, fundadores e indie hackers. O produto é inspirado no
[PostBridge](https://www.post-bridge.com/) e busca simplificar a gestão de
diversas redes sociais em um único lugar.

## Sobre o produto

O Postmade permitirá conectar contas sociais via OAuth, criar publicações com
texto, imagens ou vídeos e distribuí-las simultaneamente entre diferentes
plataformas. O usuário poderá personalizar o conteúdo por rede, publicar
imediatamente ou programar o envio por meio de um calendário.

As integrações planejadas inicialmente incluem Facebook, LinkedIn, Instagram,
TikTok e YouTube. Entre os principais recursos previstos estão:

- publicação em múltiplas redes sociais;
- agendamento e calendário de conteúdo;
- personalização e preview por plataforma;
- grupos reutilizáveis de tags e hashtags;
- upload temporário de mídia com limpeza automática após publicação e retry;
- assinatura mensal configurável por quantidade de canais e membros.

## Escopo atual

O monorepo contém o front-end do MVP e a primeira fatia vertical do back-end:
autenticação nativa com verificação por e-mail, sessões seguras e workspaces
persistidos. Canais, publicações, tags e assinatura ainda possuem fluxos locais;
OAuth, pagamentos e publicação real serão conectados em incrementos futuros.

O projeto foi organizado para evoluir para uma arquitetura com NestJS,
PostgreSQL, Prisma, Redis/BullMQ e Stripe, sem acoplar o front-end atual a uma
implementação prematura desses serviços.

## Stack atual

- Monorepo com Turborepo e pnpm;
- Vite, React e TypeScript;
- Redux Toolkit e RTK Query;
- Tailwind CSS e base de componentes Shadcn/ui;
- React Router e react-i18next;
- Vitest e Testing Library.

## Requisitos

- Node.js 22.12 ou superior
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
- `apps/api`: API NestJS/Prisma documentada com Swagger.
- `packages/types`: contratos TypeScript compartilháveis entre aplicações.
- `apps/web/src/features`: módulos de negócio isolados.
- `apps/web/src/shared`: infraestrutura e componentes genéricos.
- `apps/web/src/routes`: definição das rotas da aplicação.
- `docs`: decisões e convenções de arquitetura do projeto.

As convenções adotas para este projeto podem ser encontradas em [`docs/`](docs/). Leia atentamente antes de realizar alterações no código ou implementar novas features.

## Back-end local

```bash
docker compose up -d --build
pnpm db:deploy
```

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/docs`
- Mailpit: `http://localhost:8025`

Copie `.env.example` para `apps/api/.env` ao executar a API fora do Docker. O comando
`pnpm db:seed` cria somente a conta demonstrativa local.

O armazenamento temporário de mídia requer um bucket privado Cloudflare R2 e as
variáveis `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_ACCESS_KEY_ID` e
`R2_SECRET_ACCESS_KEY`. Consulte [`docs/media-storage.md`](docs/media-storage.md)
para CORS, lifecycle, limites e retenção. Nunca exponha essas credenciais no web.

### Prisma Studio

Para visualizar e editar os dados do banco local por uma interface web:

```bash
pnpm db:studio
```

Com o comando em execução, acesse `http://localhost:5555`. O Prisma Studio deve
ser utilizado somente no ambiente de desenvolvimento e não deve ser exposto em
produção.

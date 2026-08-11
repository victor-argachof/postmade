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
- upload e gerenciamento de mídia;
- assinatura mensal configurável por quantidade de canais e membros.

## Escopo atual

Esta fase concentra-se somente no front-end do MVP: autenticação, shell do
dashboard, conta do usuário, assinatura, canais e os fluxos locais de criação,
gestão e agendamento de publicações, além de grupos reutilizáveis de tags. Os dados e a sessão ainda são locais; integrações
OAuth, pagamentos e publicação real dependerão do futuro back-end.

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
- `apps/web/src/routes`: definição das rotas da aplicação.
- `docs`: decisões e convenções de arquitetura do projeto.

As convenções adotas para este projeto podem ser encontradas em [`docs/`](docs/). Leia atentamente antes de realizar alterações no código ou implementar novas features.

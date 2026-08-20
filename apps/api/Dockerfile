FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --frozen-lockfile
COPY apps/api apps/api
COPY packages/types packages/types

FROM base AS development
RUN pnpm --filter @postmade/api prisma:generate
CMD ["pnpm", "--filter", "@postmade/api", "dev"]

FROM base AS build
RUN pnpm --filter @postmade/api prisma:generate && pnpm --filter @postmade/api build

FROM node:22-alpine AS production
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
USER node
CMD ["node", "apps/api/dist/src/main.js"]

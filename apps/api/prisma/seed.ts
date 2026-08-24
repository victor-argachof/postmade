import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";

import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
  max: 2,
});
const prisma = new PrismaClient({ adapter });
async function main() {
  const email = "demo@postmade.local";
  const started = new Date();
  const ends = new Date(started);
  ends.setDate(ends.getDate() + 15);
  await prisma.$transaction(async (tx) => {
    let user = await tx.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = await argon2.hash("Postmade123!");
      user = await tx.user.create({
        data: {
          name: "Postmade Demo",
          email,
          identities: {
            create: {
              provider: "password",
              providerSubject: `password:${email}`,
              emailVerified: true,
              credential: { create: { passwordHash } },
            },
          },
        },
      });
    }
    let workspace = await tx.workspace.findFirst({
      where: { ownerId: user.id },
      orderBy: { createdAt: "asc" },
    });
    if (!workspace) {
      workspace = await tx.workspace.create({
        data: {
          name: "Workspace de Postmade Demo",
          ownerId: user.id,
          timezone: "America/Sao_Paulo",
          trialStartedAt: started,
          trialEndsAt: ends,
        },
      });
      await tx.workspaceMember.create({
        data: { workspaceId: workspace.id, userId: user.id, role: "owner" },
      });
    }
    const mockChannels = [
      ["instagram", "Postmade Instagram", "@postmade"],
      ["linkedin", "Postmade LinkedIn", "Postmade"],
      ["facebook", "Postmade Facebook", "@postmade.app"],
    ] as const;
    for (const [platform, displayName, username] of mockChannels) {
      const providerAccountId = `seed:${platform}:postmade`;
      await tx.channel.upsert({
        where: {
          workspaceId_platform_providerAccountId: {
            workspaceId: workspace.id,
            platform,
            providerAccountId,
          },
        },
        create: {
          id: `development-${platform}-channel:${workspace.id}`,
          workspaceId: workspace.id,
          platform,
          providerAccountId,
          displayName,
          username,
          avatarUrl: "/favicon.png",
          searchText: `${displayName} ${username}`.toLocaleLowerCase("en-US"),
          createdBy: user.id,
        },
        update: {
          displayName,
          username,
          avatarUrl: "/favicon.png",
          searchText: `${displayName} ${username}`.toLocaleLowerCase("en-US"),
          connectionStatus: "connected",
          disconnectedAt: null,
        },
      });
    }
  });
}
main().finally(() => prisma.$disconnect());

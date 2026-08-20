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
  if (await prisma.user.findUnique({ where: { email } })) return;
  const passwordHash = await argon2.hash("Postmade123!");
  const started = new Date();
  const ends = new Date(started);
  ends.setDate(ends.getDate() + 15);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
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
    const workspace = await tx.workspace.create({
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
  });
}
main().finally(() => prisma.$disconnect());

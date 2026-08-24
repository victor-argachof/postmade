CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'revoked');

CREATE TABLE "WorkspaceInvitation" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "WorkspaceRole" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" "InvitationStatus" NOT NULL DEFAULT 'pending',
  "invitedBy" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkspaceInvitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkspaceInvitation_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WorkspaceInvitation_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WorkspaceInvitation_tokenHash_key" ON "WorkspaceInvitation"("tokenHash");
CREATE INDEX "WorkspaceInvitation_workspaceId_status_expiresAt_idx" ON "WorkspaceInvitation"("workspaceId", "status", "expiresAt");
CREATE INDEX "WorkspaceInvitation_workspaceId_email_status_idx" ON "WorkspaceInvitation"("workspaceId", "email", "status");
ALTER TABLE "EmailChallenge" ADD COLUMN "pendingInvitationId" TEXT;

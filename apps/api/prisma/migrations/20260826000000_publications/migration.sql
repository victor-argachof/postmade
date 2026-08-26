CREATE TYPE "PublicationStatus" AS ENUM ('draft', 'scheduled', 'publishing', 'published', 'failed');

CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "content" TEXT NOT NULL,
    "tagGroupSnapshots" JSONB NOT NULL DEFAULT '[]',
    "scheduledFor" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PublicationTarget" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "contentOverride" TEXT,
    "tagGroupSnapshotsOverride" JSONB,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "status" "PublicationStatus" NOT NULL DEFAULT 'draft',
    "errorCode" TEXT,
    "externalUrl" TEXT,
    CONSTRAINT "PublicationTarget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Publication_workspaceId_status_idx" ON "Publication"("workspaceId", "status");
CREATE INDEX "Publication_workspaceId_scheduledFor_idx" ON "Publication"("workspaceId", "scheduledFor");
CREATE INDEX "Publication_workspaceId_publishedAt_idx" ON "Publication"("workspaceId", "publishedAt");
CREATE INDEX "Publication_workspaceId_createdAt_idx" ON "Publication"("workspaceId", "createdAt");
CREATE UNIQUE INDEX "PublicationTarget_publicationId_channelId_key" ON "PublicationTarget"("publicationId", "channelId");
CREATE INDEX "PublicationTarget_channelId_idx" ON "PublicationTarget"("channelId");
CREATE INDEX "PublicationTarget_publicationId_status_idx" ON "PublicationTarget"("publicationId", "status");

ALTER TABLE "Publication" ADD CONSTRAINT "Publication_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PublicationTarget" ADD CONSTRAINT "PublicationTarget_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "Publication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PublicationTarget" ADD CONSTRAINT "PublicationTarget_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

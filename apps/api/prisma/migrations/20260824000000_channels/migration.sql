-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('facebook', 'linkedin', 'instagram', 'tiktok', 'youtube');

-- CreateEnum
CREATE TYPE "ChannelConnectionStatus" AS ENUM ('connected', 'requires_reauthentication', 'unavailable', 'disconnected');

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "searchText" TEXT NOT NULL,
    "connectionStatus" "ChannelConnectionStatus" NOT NULL DEFAULT 'connected',
    "lastCheckedAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Channel_workspaceId_platform_providerAccountId_key" ON "Channel"("workspaceId", "platform", "providerAccountId");
CREATE INDEX "Channel_workspaceId_connectionStatus_idx" ON "Channel"("workspaceId", "connectionStatus");
CREATE INDEX "Channel_workspaceId_platform_idx" ON "Channel"("workspaceId", "platform");
CREATE INDEX "Channel_workspaceId_searchText_idx" ON "Channel"("workspaceId", "searchText");
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

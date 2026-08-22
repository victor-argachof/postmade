CREATE TABLE "TagGroup" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "tags" TEXT[] NOT NULL,
  "tagCount" INTEGER NOT NULL,
  "searchText" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TagGroup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TagGroup_workspaceId_normalizedName_key" ON "TagGroup"("workspaceId", "normalizedName");
CREATE INDEX "TagGroup_workspaceId_name_idx" ON "TagGroup"("workspaceId", "name");
CREATE INDEX "TagGroup_workspaceId_createdAt_idx" ON "TagGroup"("workspaceId", "createdAt");
ALTER TABLE "TagGroup" ADD CONSTRAINT "TagGroup_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TagGroup" ADD CONSTRAINT "TagGroup_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

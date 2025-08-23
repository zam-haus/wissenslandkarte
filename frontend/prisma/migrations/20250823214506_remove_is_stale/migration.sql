/*
  Warnings:

  - You are about to drop the column `isStale` on the `Attachment` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "S3Object" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "url" TEXT,
    "publicUrl" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,
    "attachmentId" TEXT,
    "mainImageInProjectId" TEXT,
    "imageOfUserId" TEXT,
    CONSTRAINT "S3Object_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "S3Object_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "Attachment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "S3Object_mainImageInProjectId_fkey" FOREIGN KEY ("mainImageInProjectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "S3Object_imageOfUserId_fkey" FOREIGN KEY ("imageOfUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "creationDate" DATETIME NOT NULL,
    "projectId" TEXT,
    "projectStepId" TEXT,
    CONSTRAINT "Attachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_projectStepId_fkey" FOREIGN KEY ("projectStepId") REFERENCES "ProjectStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Attachment" ("creationDate", "id", "projectId", "projectStepId", "text", "type", "url") SELECT "creationDate", "id", "projectId", "projectStepId", "text", "type", "url" FROM "Attachment";
DROP TABLE "Attachment";
ALTER TABLE "new_Attachment" RENAME TO "Attachment";
CREATE INDEX "Attachment_projectId_projectStepId_idx" ON "Attachment"("projectId", "projectStepId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "S3Object_key_key" ON "S3Object"("key");

-- CreateIndex
CREATE UNIQUE INDEX "S3Object_publicUrl_key" ON "S3Object"("publicUrl");

-- CreateIndex
CREATE UNIQUE INDEX "S3Object_attachmentId_key" ON "S3Object"("attachmentId");

-- CreateIndex
CREATE UNIQUE INDEX "S3Object_mainImageInProjectId_key" ON "S3Object"("mainImageInProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "S3Object_imageOfUserId_key" ON "S3Object"("imageOfUserId");

-- CreateIndex
CREATE INDEX "S3Object_status_idx" ON "S3Object"("status");

-- CreateIndex
CREATE INDEX "S3Object_publicUrl_idx" ON "S3Object"("publicUrl");

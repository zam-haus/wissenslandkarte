-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "creationDate" DATETIME NOT NULL,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
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

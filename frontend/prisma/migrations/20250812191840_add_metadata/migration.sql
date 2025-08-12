-- CreateTable
CREATE TABLE "MetadataType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dataType" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "MetadataTypeTranslation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "language" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "metadataTypeId" TEXT NOT NULL,
    CONSTRAINT "MetadataTypeTranslation_metadataTypeId_fkey" FOREIGN KEY ("metadataTypeId") REFERENCES "MetadataType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "metadataTypeId" TEXT NOT NULL,
    CONSTRAINT "ProjectMetadata_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectMetadata_metadataTypeId_fkey" FOREIGN KEY ("metadataTypeId") REFERENCES "MetadataType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MetadataType_name_key" ON "MetadataType"("name");

-- CreateIndex
CREATE INDEX "MetadataType_name_idx" ON "MetadataType"("name");

-- CreateIndex
CREATE INDEX "MetadataTypeTranslation_language_metadataTypeId_idx" ON "MetadataTypeTranslation"("language", "metadataTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "MetadataTypeTranslation_metadataTypeId_language_key" ON "MetadataTypeTranslation"("metadataTypeId", "language");

-- CreateIndex
CREATE INDEX "ProjectMetadata_projectId_idx" ON "ProjectMetadata"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMetadata_metadataTypeId_idx" ON "ProjectMetadata"("metadataTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMetadata_projectId_metadataTypeId_key" ON "ProjectMetadata"("projectId", "metadataTypeId");

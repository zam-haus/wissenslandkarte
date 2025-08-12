import { type Prisma } from "prisma/generated";
import { prisma } from "~/database/db.server";

export type MetadataValue = Prisma.ProjectGetPayload<{
  select: {
    metadata: {
      select: {
        id: true;
        value: true;
        metadataType: {
          select: {
            id: true;
            name: true;
            dataType: true;
            translations: {
              select: {
                language: true;
                displayName: true;
                description: true;
                unit: true;
              };
            };
          };
        };
      };
    };
  };
}>["metadata"][number];

export type ShallowMetadataValue = {
  metadataTypeId: string;
  value: string;
};

export type MetadataType = Prisma.MetadataTypeGetPayload<{
  select: {
    id: true;
    name: true;
    dataType: true;
    translations: {
      select: {
        language: true;
        displayName: true;
        description: true;
        unit: true;
      };
    };
  };
}>;

export async function getAllMetadataTypes(): Promise<MetadataType[]> {
  return prisma.metadataType.findMany({
    select: {
      id: true,
      name: true,
      dataType: true,
      translations: {
        select: {
          language: true,
          displayName: true,
          description: true,
          unit: true,
        },
      },
    },
  });
}

export async function upsertProjectMetadata(
  projectId: string,
  metadataTypeId: string,
  value: string,
): Promise<void> {
  await prisma.projectMetadata.upsert({
    where: {
      projectId_metadataTypeId: {
        projectId,
        metadataTypeId,
      },
    },
    update: {
      value,
    },
    create: {
      projectId,
      metadataTypeId,
      value,
    },
  });
}

export async function deleteProjectMetadata(
  projectId: string,
  metadataTypeId: string,
): Promise<void> {
  await prisma.projectMetadata.deleteMany({
    where: {
      projectId,
      metadataTypeId,
    },
  });
}

export async function deleteAllProjectMetadata(projectId: string): Promise<void> {
  await prisma.projectMetadata.deleteMany({
    where: {
      projectId,
    },
  });
}

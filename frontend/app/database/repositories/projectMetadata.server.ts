import { Prisma } from "prisma/generated";

export type ProjectMetadata = Prisma.ProjectGetPayload<{
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
}>["metadata"];

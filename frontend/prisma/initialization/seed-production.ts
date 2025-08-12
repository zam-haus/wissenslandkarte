import { PrismaClient } from "../generated";

import { roles as builtInRoles, metadataTypes } from "./data/production-data-generators.ts";

export async function seedProductionData(prisma: PrismaClient) {
  console.log("🚜 Seeding production data");
  console.log("🌱 Seeding roles");
  await seedRoles(prisma);
  console.log("🌱 Seeding metadata types");
  await seedMetadataTypes(prisma);
}

async function seedRoles(prisma: PrismaClient) {
  for (const title of builtInRoles) {
    await prisma.role.upsert({
      where: { title },
      update: { title },
      create: { title },
    });
  }
}

async function seedMetadataTypes(prisma: PrismaClient) {
  for (const metadataType of metadataTypes) {
    // Create or update the metadata type
    const createdMetadataType = await prisma.metadataType.upsert({
      where: { name: metadataType.name },
      update: {
        dataType: metadataType.dataType,
      },
      create: {
        name: metadataType.name,
        dataType: metadataType.dataType,
      },
    });

    // Create or update translations
    for (const translation of metadataType.translations) {
      await prisma.metadataTypeTranslation.upsert({
        where: {
          metadataTypeId_language: {
            metadataTypeId: createdMetadataType.id,
            language: translation.language,
          },
        },
        update: {
          displayName: translation.displayName,
          description: translation.description,
          unit: translation.unit,
        },
        create: {
          metadataTypeId: createdMetadataType.id,
          language: translation.language,
          displayName: translation.displayName,
          description: translation.description,
          unit: translation.unit,
        },
      });
    }
  }
}

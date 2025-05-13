import { PrismaClient } from "@prisma/client";

import { roles as builtInRoles } from "./data/production-data-generators.ts";

export async function seedProductionData(prisma: PrismaClient) {
  console.log("🚜 Seeding production data");
  console.log("🌱 Seeding roles");
  await seedRoles(prisma);
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

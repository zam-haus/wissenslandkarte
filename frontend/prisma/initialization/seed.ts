import { parseArgs } from "node:util";

import { PrismaClient } from "@prisma/client";

import { seedProductionData } from "./seed-production.ts";

export type SeedingOptions = {
  environment: "development" | "production";
  seedFakeData: boolean;
};

function parseCliArguments(): Promise<SeedingOptions> {
  const {
    values: { environment },
  } = parseArgs({
    options: {
      environment: { type: "string" },
    },
  });

  if (!environment || (environment !== "development" && environment !== "production")) {
    throw Error(
      "environment must be either 'development' or 'production' (e.g. --environment development)",
    );
  }

  return Promise.resolve({
    environment,
    seedFakeData: environment === "development",
  });
}

const prisma = new PrismaClient();

async function seed(options: SeedingOptions) {
  await seedProductionData(prisma);

  if (options.environment === "development") {
    // this is a dynamic import so that we don't need to install dev dependencies for seeding in production
    const { seedDevData } = await import("./seed-dev.ts");
    // this is a dynamic import because the imports in this module don't work after built (i.e. in production)
    const { rebuildSearchIndex } = await import("./rebuild-search-index.ts");

    await seedDevData(prisma, options);
    await rebuildSearchIndex(prisma);
  }
}

void parseCliArguments()
  .then(seed)
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .then(async () => {
    await prisma.$disconnect();
  });

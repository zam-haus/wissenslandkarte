import { MeiliSearch } from "meilisearch";

import { setSearchIndexOutdated } from "~/database/repositories/appStatus.server";
import {
  removeAllSearchIndexesRaw,
  upsertProjectStepsToSearchIndexRaw,
  upsertProjectsToSearchIndexRaw,
} from "~/lib/search/rawCommands.server";
import {
  projectIndexId,
  projectStepsIndexId,
  SearchableProjectProperties,
  SearchableProjectStepProperties,
} from "~/lib/search/search.server";

import { environment } from "../../app/lib/environment.server";
import type { PrismaClient } from "../generated";

const client = new MeiliSearch({
  host: environment.search.HOST,
  apiKey: environment.search.MASTER_KEY,
});

export async function rebuildSearchIndex(prisma: PrismaClient) {
  console.log("");
  console.log("Cleaning and rebuilding search index");
  try {
    await client.getVersion();
  } catch {
    await setSearchIndexOutdated(true);
    console.warn("🚨 Could not connect to meilisearch.");
    console.warn("🚨 Cleaning and rebuilding search index impossible.");
    console.warn("🚨 Search index might be out of sync!");
    return;
  }

  console.log("Purging existing indexes");
  await removeAllSearchIndexesRaw(client);
  const projects = await prisma.project.findMany();
  const stepsInDb = await prisma.projectStep.findMany();

  const projectIndex = client.index<SearchableProjectProperties>(projectIndexId);
  const projectStepsIndex = client.index<SearchableProjectStepProperties>(projectStepsIndexId);

  console.log("🏗 Building project search index");
  await upsertProjectsToSearchIndexRaw(projectIndex, projects);

  console.log("🏗 🏗 Building project steps search index");
  await upsertProjectStepsToSearchIndexRaw(projectStepsIndex, stepsInDb);

  console.log("🏗 🏗 🏗 Search index built");
}

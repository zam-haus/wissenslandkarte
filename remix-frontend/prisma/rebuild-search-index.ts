import type { PrismaClient } from "@prisma/client";
import { MeiliSearch } from "meilisearch";

import { environment } from "~/lib/environment";
import type {
  SearchableProjectProperties,
  SearchableProjectStepProperties,
} from "~/lib/search.server";
import { projectIndexId, projectStepsIndexId } from "~/lib/search.server";

const client = new MeiliSearch({
  host: environment.search.HOST,
  apiKey: environment.search.MASTER_KEY,
});

export async function rebuildSearchIndex(prisma: PrismaClient) {
  console.log("");
  console.log("Cleaning and rebuilding search index");
  try {
    await client.getVersion();
  } catch (e) {
    console.warn("🚨 Could not connect to meilisearch.");
    console.warn("🚨 Cleaning and rebuilding search index impossible.");
    console.warn("🚨 Search index might be out of sync!");
    return;
  }

  console.log("Purging existing indexes");
  await cleanSearchIndexes();
  const projects = await prisma.project.findMany();
  const stepsInDb = await prisma.projectStep.findMany();

  console.log("🏗 Building project search index");
  await upsertProjectsToSearchIndex(projects);

  console.log("🏗 🏗 Building project steps search index");
  await upsertProjectStepsToSearchIndex(stepsInDb);

  console.log("🏗 🏗 🏗 Search index built");
}

async function cleanSearchIndexes() {
  const indexes = await client.getIndexes();
  for (const index of indexes.results) {
    await client.deleteIndex(index.uid);
  }
}

async function upsertProjectsToSearchIndex(projects: SearchableProjectProperties[]) {
  const filteredProjects = projects.map(({ id, title, description }) => ({
    id,
    title,
    description,
  }));

  const projectIndex = client.index(projectIndexId);
  await projectIndex.addDocuments(filteredProjects, { primaryKey: "id" });
}

export async function upsertProjectStepsToSearchIndex(steps: SearchableProjectStepProperties[]) {
  const filteredSteps = steps.map(({ id, description, projectId }) => ({
    id,
    description,
    projectId,
  }));

  const projectStepsIndex = client.index(projectStepsIndexId);
  await projectStepsIndex.addDocuments(filteredSteps, { primaryKey: "id" });
}

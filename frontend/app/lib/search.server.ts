import { MeiliSearch } from "meilisearch";

import type { Project, ProjectStep } from "prisma/generated";

import { setSearchIndexOutdated } from "./appStatus.server";
import { environment } from "./environment.server";
import { baseLogger } from "./logging.server";

const logger = baseLogger.withTag("search");

export const projectIndexId = "projects";
export const projectStepsIndexId = "projectSteps";

const client = new MeiliSearch({
  host: environment.search.HOST,
  apiKey: environment.search.MASTER_KEY,
});

export type SearchableProjectProperties = Pick<Project, "id" | "title" | "description">;
export type SearchableProjectStepProperties = Pick<ProjectStep, "id" | "projectId" | "description">;

const projectIndex = client.index<SearchableProjectProperties>(projectIndexId);
const projectStepsIndex = client.index<SearchableProjectStepProperties>(projectStepsIndexId);

export async function upsertProjectToSearchIndex(project: SearchableProjectProperties) {
  try {
    const { id, title, description } = project; //destructuring ensures we don't add additional properties that we don't want
    await projectIndex.addDocuments([{ id, title, description }], { primaryKey: "id" });
  } catch (e) {
    logger.error("Could not upsert project into search index. Index is out of date", e);
    await setSearchIndexOutdated(true);
  }
}

export async function upsertProjectStepToSearchIndex(step: SearchableProjectStepProperties) {
  try {
    const { id, description, projectId } = step;
    await projectStepsIndex.addDocuments([{ id, description, projectId }], { primaryKey: "id" });
  } catch (e) {
    logger.error("Could not upsert project step into search index. Index is out of date", e);
    await setSearchIndexOutdated(true);
  }
}

export async function searchProjectInSearchIndex(query: string) {
  const [projectResults, projectStepResults] = await Promise.all([
    projectIndex.search(query),
    projectStepsIndex.search(query),
  ]);
  return { projectResults, projectStepResults };
}

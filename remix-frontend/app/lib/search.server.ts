import type { Project, ProjectStep } from "@prisma/client";
import { MeiliSearch } from "meilisearch";

import { environment } from "./environment";

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
  const { id, title, description } = project; //destructuring ensures we don't add additional properties that we don't want
  await projectIndex.addDocuments([{ id, title, description }], { primaryKey: "id" });
}

export async function upsertProjectStepToSearchIndex(step: SearchableProjectStepProperties) {
  const { id, description, projectId } = step;
  await projectStepsIndex.addDocuments([{ id, description, projectId }], { primaryKey: "id" });
}

export async function searchProjectInSearchIndex(query: string) {
  const [projectResults, projectStepResults] = await Promise.all([
    projectIndex.search(query),
    projectStepsIndex.search(query),
  ]);
  return { projectResults, projectStepResults };
}

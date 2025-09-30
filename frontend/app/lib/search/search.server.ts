import { MeiliSearch } from "meilisearch";

import type { Project, ProjectStep, User } from "prisma/generated";

import { setSearchIndexOutdated } from "../../database/repositories/appStatus.server";
import { environment } from "../environment.server";
import { baseLogger } from "../logging.server";

import {
  removeAllSearchIndexesRaw,
  upsertProjectStepsToSearchIndexRaw,
  upsertProjectsToSearchIndexRaw,
  upsertUsersToSearchIndexRaw,
} from "./rawCommands.server";

const logger = baseLogger.withTag("search");

export const projectIndexId = "projects";
export const projectStepsIndexId = "projectSteps";
export const userIndexId = "users";

const client = new MeiliSearch({
  host: environment.search.HOST,
  apiKey: environment.search.MASTER_KEY,
});

export type SearchableProjectProperties = Pick<Project, "id" | "title" | "description">;
export type SearchableProjectStepProperties = Pick<ProjectStep, "id" | "projectId" | "description">;
export type SearchableUserProperties = Pick<User, "id" | "username" | "description">;

const projectIndex = client.index<SearchableProjectProperties>(projectIndexId);
const projectStepsIndex = client.index<SearchableProjectStepProperties>(projectStepsIndexId);
const userIndex = client.index<SearchableUserProperties>(userIndexId);

export type SearchIndexUpsertResult = "success" | "error";

export async function upsertProjectToSearchIndex(
  project: SearchableProjectProperties,
): Promise<SearchIndexUpsertResult> {
  return upsertMultipleProjectsToSearchIndex([project]);
}

export async function upsertProjectStepToSearchIndex(
  step: SearchableProjectStepProperties,
): Promise<SearchIndexUpsertResult> {
  return upsertMultipleProjectStepsToSearchIndex([step]);
}

export async function upsertUserToSearchIndex(
  user: SearchableUserProperties,
): Promise<SearchIndexUpsertResult> {
  return upsertMultipleUsersToSearchIndex([user]);
}

export async function upsertMultipleProjectsToSearchIndex(
  projects: SearchableProjectProperties[],
): Promise<SearchIndexUpsertResult> {
  try {
    await upsertProjectsToSearchIndexRaw(projectIndex, projects);
    return "success";
  } catch (e) {
    logger.error("Could not upsert project into search index. Index is out of date", e);
    await setSearchIndexOutdated(true);
    return "error";
  }
}

export async function upsertMultipleProjectStepsToSearchIndex(
  steps: SearchableProjectStepProperties[],
): Promise<SearchIndexUpsertResult> {
  try {
    await upsertProjectStepsToSearchIndexRaw(projectStepsIndex, steps);
    return "success";
  } catch (e) {
    logger.error("Could not upsert project step into search index. Index is out of date", e);
    await setSearchIndexOutdated(true);
    return "error";
  }
}

export async function upsertMultipleUsersToSearchIndex(
  users: SearchableUserProperties[],
): Promise<SearchIndexUpsertResult> {
  try {
    await upsertUsersToSearchIndexRaw(userIndex, users);
    return "success";
  } catch (e) {
    logger.error("Could not upsert user into search index. Index is out of date", e);
    await setSearchIndexOutdated(true);
    return "error";
  }
}

export async function searchProjectInSearchIndex(query: string) {
  const [projectResults, projectStepResults] = await Promise.all([
    projectIndex.search(query),
    projectStepsIndex.search(query),
  ]);
  return { projectResults, projectStepResults };
}

export async function searchUserInSearchIndex(query: string) {
  return await userIndex.search(query);
}

export async function removeAllSearchIndexes() {
  await removeAllSearchIndexesRaw(client);
}

export async function getMeilisearchVersion() {
  return await client.getVersion();
}

import { Index, MeiliSearch } from "meilisearch";

import type {
  SearchableProjectProperties,
  SearchableProjectStepProperties,
  SearchableUserProperties,
} from "./search.server";

export async function removeAllSearchIndexesRaw(client: MeiliSearch) {
  const indexes = await client.getIndexes();
  for (const index of indexes.results) {
    await client.deleteIndex(index.uid);
  }
}

export async function upsertProjectsToSearchIndexRaw(
  projectIndex: Index<SearchableProjectProperties>,
  projects: SearchableProjectProperties[],
) {
  const filteredProjects = projects.map(({ id, title, description }) => ({
    id,
    title,
    description,
  }));

  await projectIndex.addDocuments(filteredProjects, { primaryKey: "id" });
}

export async function upsertProjectStepsToSearchIndexRaw(
  projectStepsIndex: Index<SearchableProjectStepProperties>,
  steps: SearchableProjectStepProperties[],
) {
  const filteredSteps = steps.map(({ id, description, projectId }) => ({
    id,
    description,
    projectId,
  }));

  await projectStepsIndex.addDocuments(filteredSteps, { primaryKey: "id" });
}

export async function upsertUsersToSearchIndexRaw(
  userIndex: Index<SearchableUserProperties>,
  users: SearchableUserProperties[],
) {
  await userIndex.addDocuments(users, { primaryKey: "id" });
}

export async function deleteProjectsFromSearchIndexRaw(
  projectIndex: Index<SearchableProjectProperties>,
  ids: string[],
) {
  await projectIndex.deleteDocuments(ids);
}

export async function deleteProjectStepsFromSearchIndexRaw(
  projectStepsIndex: Index<SearchableProjectStepProperties>,
  ids: string[],
) {
  await projectStepsIndex.deleteDocuments(ids);
}

export async function deleteUsersFromSearchIndexRaw(
  userIndex: Index<SearchableUserProperties>,
  ids: string[],
) {
  await userIndex.deleteDocuments(ids);
}

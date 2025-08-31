import {
  getSearchIndexRebuildProgress,
  setSearchIndexOutdated,
  setSearchIndexRebuildProgress,
  setTotalEntriesToRebuild,
} from "~/database/repositories/appStatus.server";
import { REBUILD_HAS_COMPLETED, REBUILD_HAS_FAILED } from "~/database/repositories/appStatusEnums";
import {
  getAllProjectsWithCursor,
  getTotalProjects,
} from "~/database/repositories/projects.server";
import {
  getAllProjectStepsWithCursor,
  getTotalProjectSteps,
} from "~/database/repositories/projectSteps.server";
import {
  removeAllSearchIndexes,
  upsertMultipleProjectStepsToSearchIndex,
  upsertMultipleProjectsToSearchIndex,
} from "~/lib/search/search.server";

export async function startSearchIndexRebuildJob() {
  const progress = await getSearchIndexRebuildProgress();
  if (progress >= 0) {
    throw new Error("Search index rebuilding already in progress");
  }

  const totalProjects = await getTotalProjects();
  const totalProjectSteps = await getTotalProjectSteps();
  await setTotalEntriesToRebuild(totalProjects + totalProjectSteps);

  await Promise.race([
    rebuildSearchIndex(),
    // give rebuildSearchIndex 500ms to throw
    delay(500),
  ]);
}

async function rebuildSearchIndex() {
  try {
    await removeAllSearchIndexes();
    await setSearchIndexOutdated(false);

    const batchSize = 100;
    let processedEntries = 0;

    for await (const projectBatch of getAllProjectsWithCursor(batchSize)) {
      const result = await upsertMultipleProjectsToSearchIndex(projectBatch);

      if (result === "error") {
        throw new Error("Failed to upsert projects to search index");
      }

      processedEntries += projectBatch.length;
      await setSearchIndexRebuildProgress(processedEntries);

      // give meilisearch a chance to process the batch and the server to serve other requests
      await delay(100);
    }

    for await (const stepBatch of getAllProjectStepsWithCursor(batchSize)) {
      const result = await upsertMultipleProjectStepsToSearchIndex(stepBatch);
      if (result === "error") {
        throw new Error("Failed to upsert project steps to search index");
      }

      processedEntries += stepBatch.length;
      await setSearchIndexRebuildProgress(processedEntries);

      // give meilisearch a chance to process the batch and the server to serve other requests
      await delay(100);
    }

    await setSearchIndexRebuildProgress(REBUILD_HAS_COMPLETED);
  } catch (error) {
    await setSearchIndexRebuildProgress(REBUILD_HAS_FAILED);
    await setSearchIndexOutdated(true);
    throw error;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

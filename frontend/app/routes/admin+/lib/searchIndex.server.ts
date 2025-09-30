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
import { getAllUsersWithCursor, getTotalUsers } from "~/database/repositories/user.server";
import {
  removeAllSearchIndexes,
  SearchIndexUpsertResult,
  upsertMultipleProjectStepsToSearchIndex,
  upsertMultipleProjectsToSearchIndex,
  upsertMultipleUsersToSearchIndex,
} from "~/lib/search/search.server";

export async function startSearchIndexRebuildJob() {
  const progress = await getSearchIndexRebuildProgress();
  if (progress >= 0) {
    throw new Error("Search index rebuilding already in progress");
  }

  const totalProjects = await getTotalProjects();
  const totalProjectSteps = await getTotalProjectSteps();
  const totalUsers = await getTotalUsers();
  await setTotalEntriesToRebuild(totalProjects + totalProjectSteps + totalUsers);

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

    const processBatch = async <T>(
      batch: T[],
      upsertFunction: (batch: T[]) => Promise<SearchIndexUpsertResult>,
      errorMessage: string,
    ) => {
      const result = await upsertFunction(batch);
      if (result === "error") {
        throw new Error(errorMessage);
      }
      processedEntries += batch.length;

      await setSearchIndexRebuildProgress(processedEntries);

      // give meilisearch a chance to process the batch and the server to serve other requests
      await delay(100);
    };

    for await (const projectBatch of getAllProjectsWithCursor(batchSize)) {
      await processBatch(
        projectBatch,
        upsertMultipleProjectsToSearchIndex,
        "Failed to upsert projects to search index",
      );
    }

    for await (const stepBatch of getAllProjectStepsWithCursor(batchSize)) {
      await processBatch(
        stepBatch,
        upsertMultipleProjectStepsToSearchIndex,
        "Failed to upsert project steps to search index",
      );
    }

    for await (const userBatch of getAllUsersWithCursor(batchSize)) {
      await processBatch(
        userBatch,
        upsertMultipleUsersToSearchIndex,
        "Failed to upsert users to search index",
      );
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

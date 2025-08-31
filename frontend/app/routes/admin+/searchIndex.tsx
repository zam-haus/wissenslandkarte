import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, redirect, useActionData, useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import {
  getSearchIndexRebuildProgress,
  getTotalEntriesToRebuild,
  isSearchIndexOutdated,
} from "~/database/repositories/appStatus.server";
import {
  NO_REBUILD_IN_PROGRESS,
  REBUILD_HAS_COMPLETED,
  REBUILD_HAS_FAILED,
} from "~/database/repositories/appStatusEnums";
import { loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { logger } from "~/lib/logging.server";

import { startSearchIndexRebuildJob } from "./lib/searchIndex.server";

// Only use in server functions!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const assertAuthorization = serverOnly$(async (request: Request) => {
  const isInfrastructureAdminLoggedIn = await loggedInUserHasRole(
    request,
    Roles.InfrastructureAdmin,
  );

  if (!isInfrastructureAdminLoggedIn) {
    logger("admin-search-index").warn(
      `Someone tried accessing the search index management without authorization`,
    );
    throw redirect("/");
  }
})!;

export const action = async ({ request }: ActionFunctionArgs) => {
  await assertAuthorization(request);

  try {
    await startSearchIndexRebuildJob();
    return { success: true };
  } catch (error) {
    logger("admin-search-index").error("Failed to start search index rebuild", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await assertAuthorization(request);

  const indexOutdated = await isSearchIndexOutdated();
  const rebuildProgress = await getSearchIndexRebuildProgress();
  const totalEntries = await getTotalEntriesToRebuild();
  const isRebuildInProgress = rebuildProgress >= 0;
  const canStartRebuild = !isRebuildInProgress;

  return { indexOutdated, rebuildProgress, totalEntries, canStartRebuild, isRebuildInProgress };
};

export default function SearchIndex() {
  const { indexOutdated, rebuildProgress, totalEntries, canStartRebuild, isRebuildInProgress } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const revalidator = useRevalidator();
  const { t } = useTranslation("admin");

  useEffect(() => {
    if (rebuildProgress >= 0) {
      const interval = setInterval(() => {
        revalidator.revalidate();
      }, 200);
      return () => clearInterval(interval);
    }
  }, [rebuildProgress, revalidator]);

  return (
    <div>
      <h2>{t("searchIndex.status-title")}</h2>
      <div>
        {indexOutdated ? (
          <em style={{ color: "red" }}>{t("searchIndex.status.outdated")}</em>
        ) : (
          <span style={{ color: "green" }}>{t("searchIndex.status.upToDate")}</span>
        )}
      </div>

      <h2>{t("searchIndex.rebuild-title")}</h2>
      <StatusMessage rebuildProgress={rebuildProgress} />

      {actionData?.success ? (
        <div style={{ color: "green", marginBottom: "1rem" }}>
          {t("searchIndex.rebuild.success")}
        </div>
      ) : null}

      {actionData?.success === false ? (
        <div style={{ color: "red", marginBottom: "1rem" }}>
          {t("searchIndex.rebuild.error")} {actionData.error}
        </div>
      ) : null}

      {isRebuildInProgress ? (
        <ProgressBar rebuildProgress={rebuildProgress} totalEntries={totalEntries} />
      ) : null}

      <Form method="post">
        <input type="hidden" name="action" value="rebuild" />
        <button type="submit" disabled={!canStartRebuild}>
          {isRebuildInProgress
            ? t("searchIndex.status.rebuildInProgress")
            : t("searchIndex.rebuild.button")}
        </button>
      </Form>
    </div>
  );
}
function StatusMessage({ rebuildProgress }: { rebuildProgress: number }) {
  const { t } = useTranslation("admin");

  const getStatusMessage = () => {
    if (rebuildProgress === NO_REBUILD_IN_PROGRESS) {
      return t("searchIndex.status.noRebuildEverStarted");
    } else if (rebuildProgress === REBUILD_HAS_FAILED) {
      return t("searchIndex.status.rebuildFailed");
    } else if (rebuildProgress === REBUILD_HAS_COMPLETED) {
      return t("searchIndex.status.rebuildCompleted");
    } else if (rebuildProgress >= 0) {
      return t("searchIndex.status.rebuildInProgress");
    }
    return t("searchIndex.status.unknown");
  };

  return <div>{getStatusMessage()}</div>;
}

function ProgressBar({
  rebuildProgress,
  totalEntries,
}: {
  rebuildProgress: number;
  totalEntries: number;
}) {
  const getProgressPercentage = () => {
    if (rebuildProgress < 0 || totalEntries === 0) return 0;
    return Math.round((rebuildProgress / totalEntries) * 100);
  };

  if (rebuildProgress < 0) return null;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ marginBottom: "0.5rem" }}>
        {rebuildProgress >= 0 && totalEntries > 0 ? (
          <span>
            Processing: {rebuildProgress}/{totalEntries} ({getProgressPercentage()}%)
          </span>
        ) : null}
      </div>
      <div
        style={{
          width: "100%",
          height: "20px",
          backgroundColor: "#f0f0f0",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${getProgressPercentage()}%`,
            height: "100%",
            backgroundColor: "#007bff",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import InfiniteScroll from "react-infinite-scroll-component";

import { mapDeserializedDates } from "~/components/date-rendering";
import { Pager, usePagedInfinitScroll } from "~/components/infinite-scroll-pager";
import { ProjectsList } from "~/components/projects/projects-list";
import type { ProjectListEntry } from "~/models/projects.server";
import { getProjectList } from "~/models/projects.server";

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const parsedPage = parseInt(url.searchParams.get("page") || "0", 10);
  const page = isNaN(parsedPage) ? 0 : parsedPage;

  const projects = await getProjectList({ limit: 30, page });

  return json({ pageData: projects, page });
};

export const handle = {
  i18n: ["common", "projects"],
};

export default function Projects() {
  const { t } = useTranslation("common");
  const loaderData = useLoaderData<typeof loader>();

  const {
    pageData: projects,
    page,
    hasMore,
    fetcher,
  } = usePagedInfinitScroll<ProjectListEntry>(
    loaderData,
    useCallback(
      (loadedData) => ({
        ...loadedData,
        pageData: loadedData.pageData.map(mapDeserializedDates("latestModificationDate")),
      }),
      []
    )
  );

  const loadMore = () => {
    // without this ?index fetcher loads from the loader located at _layout.tsx
    // see also https://github.com/kiliman/remix-flat-routes/issues/116
    fetcher.load(`${location.pathname}?index&page=${page + 1}`);
  };

  return (
    <InfiniteScroll
      scrollableTarget="globalScrollContainer"
      next={loadMore}
      loader={t("loading-more")}
      dataLength={projects.length}
      hasMore={hasMore}
    >
      <ProjectsList projects={projects}></ProjectsList>
      <Pager page={page} hasMore={hasMore} t={t}></Pager>
    </InfiniteScroll>
  );
}

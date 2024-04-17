import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import InfiniteScroll from "react-infinite-scroll-component";

import { mapDeserializedDates } from "~/components/date-rendering";
import { ProjectsList } from "~/components/projects/projects-list";
import type { ProjectList } from "~/models/projects.server";
import { getProjectList } from "~/models/projects.server";

export const loader = async ({ request }: LoaderArgs) => {
  const url = new URL(request.url);
  const parsedPage = parseInt(url.searchParams.get("page") || "0", 10);
  const page = isNaN(parsedPage) ? 0 : parsedPage;

  const projects = await getProjectList({ limit: 30, page });

  return json({ projects, page });
};

export const handle = {
  i18n: ["common", "projects"],
};

export default function Projects() {
  const { t } = useTranslation("common");
  const { projects: initialProjects, page: initialPage } = useLoaderData<typeof loader>();
  const [projects, setProjects] = useState<ProjectList[]>(
    initialProjects.map(mapDeserializedDates("latestModificationDate"))
  );
  const [page, setPage] = useState(initialPage + 1);
  const fetcher = useFetcher<typeof loader>();

  const hasMore = fetcher.data === undefined || fetcher.data.projects.length !== 0;
  const loadMore = () => {
    // without this ?index fetcher loads from the loader located at _layout.tsx
    // see also https://github.com/kiliman/remix-flat-routes/issues/116
    fetcher.load(`${location.pathname}?index&page=${page}`);
  };

  useEffect(() => {
    if (!fetcher.data || fetcher.state === "loading") {
      return;
    }
    if (fetcher.data) {
      const newProjects = fetcher.data.projects.map(mapDeserializedDates("latestModificationDate"));
      setProjects((projects) => [...projects, ...newProjects]);
      setPage(fetcher.data.page + 1);
    }
  }, [fetcher.data, fetcher.state]);

  return (
    <InfiniteScroll
      scrollableTarget="globalScrollContainer"
      next={loadMore}
      loader={t("loading-more")}
      dataLength={projects.length}
      hasMore={hasMore}
    >
      <ProjectsList projects={projects}></ProjectsList>
    </InfiniteScroll>
  );
}

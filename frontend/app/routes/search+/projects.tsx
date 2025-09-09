import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { ProjectsList } from "~/components/project-list/projects-list";
import type { ProjectListEntry } from "~/database/repositories/projects.server";
import { getProjectDetails, getProjectList } from "~/database/repositories/projects.server";
import { logger } from "~/lib/logging.server";
import { searchProjectInSearchIndex } from "~/lib/search/search.server";

import { getSearchQuery, SearchForm } from "./components/search-form";
import { SearchProjectPeopleSwitch } from "./components/search-header";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { searchParams } = new URL(request.url);
  const { query, tagFilter } = getSearchQuery(searchParams);

  function filterByTags(projects: ProjectListEntry[]) {
    return tagFilter.length === 0
      ? projects
      : projects.filter((project) =>
          tagFilter.every((tag) => project.tags.map((it) => it.name).includes(tag)),
        );
  }

  if (query === null || query.trim() === "") {
    const projects = filterByTags(await getProjectList({ limit: 50 }));
    return { projects, searchError: null };
  }

  try {
    const { projectResults, projectStepResults } = await searchProjectInSearchIndex(query);

    const projectIds = Array.from(
      new Set([
        ...projectResults.hits.map(({ id }) => id),
        ...projectStepResults.hits
          .map(({ projectId }) => projectId)
          .filter((it): it is string => it !== null),
      ]),
    );

    const foundProjects = (await Promise.all(projectIds.map((id) => getProjectDetails(id)))).filter(
      function isNotNull<B>(it: B | null): it is B {
        return it !== null;
      },
    );

    return { projects: filterByTags(foundProjects), searchError: null };
  } catch (error) {
    // If search fails, fall back to showing all projects with tag filtering
    logger("project-search").error("Search service unavailable:", error);
    const projects = filterByTags(await getProjectList({ limit: 50 }));
    return { projects, searchError: "search-unavailable" };
  }
};

export const handle = {
  i18n: ["projects", "users"],
};

export default function Search() {
  const { projects, searchError } = useLoaderData<typeof loader>();
  const { t } = useTranslation("search");

  return (
    <main>
      <SearchProjectPeopleSwitch />
      <SearchForm />
      {searchError ? (
        <div className="error small-padding small-round min margin">
          <i>error</i>
          <span>{t("search-error")}</span>
        </div>
      ) : null}
      <ProjectsList projects={projects}></ProjectsList>
    </main>
  );
}

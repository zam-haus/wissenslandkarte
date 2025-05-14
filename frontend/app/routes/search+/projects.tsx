import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { ProjectsList } from "~/components/project-list/projects-list";
import { searchProjectInSearchIndex } from "~/lib/search.server";
import type { ProjectListEntry } from "~/models/projects.server";
import { getProjectDetails, getProjectList } from "~/models/projects.server";

import { getSearchQuery, SearchForm } from "./components/search-form";
import { SearchProjectPeopleSwitch } from "./components/search-header";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { searchParams } = new URL(request.url);
  const { query, tagFilter } = getSearchQuery(searchParams);

  function filterByTags(projects: ProjectListEntry[]) {
    return tagFilter.length === 0
      ? projects
      : projects.filter((project) =>
          tagFilter.some((tag) => project.tags.map((it) => it.name).includes(tag)),
        );
  }

  if (query === null || query.trim() === "") {
    const projects = filterByTags(await getProjectList({ limit: 50 }));
    return { projects };
  }

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

  return { projects: filterByTags(foundProjects) };
};

export const handle = {
  i18n: ["projects", "users"],
};

export default function Search() {
  const { projects } = useLoaderData<typeof loader>();

  return (
    <main>
      <SearchForm />
      <SearchProjectPeopleSwitch />
      <ProjectsList projects={projects}></ProjectsList>
    </main>
  );
}

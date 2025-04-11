import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { mapDeserializedDates } from "~/components/date-rendering";
import { ProjectsList } from "~/components/projects/projects-list";
import { searchProjectInSearchIndex } from "~/lib/search.server";
import { getProjectDetails, getProjectList } from "~/models/projects.server";

import { getSearchQuery, SearchForm } from "./components/search-form";
import { SearchProjectPeopleSwitch } from "./components/search-header";

export const loader = async ({ request }: LoaderArgs) => {
  const { searchParams } = new URL(request.url);
  const { query, tagFilter } = getSearchQuery(searchParams);

  if (query === null || query.trim() === "") {
    const projects = await getProjectList();
    return json({ projects });
  }

  const { projectResults, projectStepResults } = await searchProjectInSearchIndex(query);

  const projectIds = [
    ...projectResults.hits.map(({ id }) => id),
    ...projectStepResults.hits
      .map(({ projectId }) => projectId)
      .filter((it): it is string => it !== null),
  ];

  const foundProjects = (await Promise.all(projectIds.map((id) => getProjectDetails(id)))).filter(
    <A, B extends A | null>(it: B): it is NonNullable<B> => it !== null
  );

  const foundAndFilteredProjects =
    tagFilter.length === 0
      ? foundProjects
      : foundProjects.filter((project) =>
          tagFilter.some((tag) => project.tags.map((it) => it.name).includes(tag))
        );

  return json({ projects: foundAndFilteredProjects });
};

export const handle = {
  i18n: ["search"],
};

export default function Search() {
  const { projects } = useLoaderData<typeof loader>();

  return (
    <main>
      <SearchForm />
      <SearchProjectPeopleSwitch />
      <ProjectsList
        projects={projects.map(mapDeserializedDates("latestModificationDate"))}
      ></ProjectsList>
    </main>
  );
}

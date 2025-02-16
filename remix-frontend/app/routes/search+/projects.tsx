import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { mapDeserializedDates } from "~/components/date-rendering";
import { ProjectsList } from "~/components/projects/projects-list";
import { getProjectList, searchProjects } from "~/models/projects.server";

import { getSearchQuery, SearchForm } from "./components/search-form";
import { SearchProjectPeopleSwitch } from "./components/search-header";

export const loader = async ({ request }: LoaderArgs) => {
  const query = getSearchQuery(request);

  if (query === null || query.trim() === "") {
    const projects = await getProjectList();
    return json({ projects });
  }

  const projects = await searchProjects(query.split(" "));
  return json({ projects });
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

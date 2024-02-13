import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { mapDeserializedDates } from "~/components/date-rendering";
import { ProjectsList } from "~/components/projects/projects-list";
import { getProjectList } from "~/models/projects.server";

export const loader = async () => {
  const projects = await getProjectList();

  return json({ projects });
};

export const handle = {
  i18n: ["projects"],
};

export default function Projects() {
  const { projects } = useLoaderData<typeof loader>();

  return (
    <ProjectsList
      projects={projects.map(mapDeserializedDates("latestModificationDate"))}
    ></ProjectsList>
  );
}

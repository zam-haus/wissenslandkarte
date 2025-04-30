import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { mapDeserializedDates } from "~/components/date-rendering";
import { ProjectsList } from "~/components/projects/projects-list";
import { getLoggedInUser } from "~/lib/authorization.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import { getProjectsByUser } from "~/models/projects.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getLoggedInUser(request, { ifNotLoggedInRedirectTo: "/" });
  const projects = await getProjectsByUser(user.username);

  return { projects };
};

export const handle = {
  i18n: ["projects"],
};

export default function Projects() {
  const { projects } = useLoaderData<typeof loader>();

  const projectsWithDates = projects.map(mapDeserializedDates("latestModificationDate"));
  projectsWithDates.sort(descendingByDatePropertyComparator("latestModificationDate"));

  return <ProjectsList projects={projectsWithDates}></ProjectsList>;
}

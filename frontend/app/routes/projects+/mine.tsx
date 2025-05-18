import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { ProjectsList } from "~/components/project-list/projects-list";
import { getProjectsByUser } from "~/database/repositories/projects.server";
import { getLoggedInUser } from "~/lib/authorization.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getLoggedInUser(request, { ifNotLoggedInRedirectTo: "/" });
  const projects = await getProjectsByUser(user.username);

  return { projects };
};

export default function Projects() {
  const { projects } = useLoaderData<typeof loader>();

  const projectsWithDates = projects;
  projectsWithDates.sort(descendingByDatePropertyComparator("latestModificationDate"));

  return <ProjectsList projects={projectsWithDates}></ProjectsList>;
}

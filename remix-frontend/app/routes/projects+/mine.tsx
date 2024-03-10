import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { mapDeserializedDates } from "~/components/date-rendering";
import { ProjectsList } from "~/components/projects/projects-list";
import { authenticator } from "~/lib/authentication.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import { getProjectsByUser } from "~/models/projects.server";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/" });
  const projects = await getProjectsByUser(user.username);

  return json({ projects });
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

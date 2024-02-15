import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { mapDeserializedDates } from "~/components/date-rendering";
import { ProjectsList } from "~/components/projects/projects-list";
import { authenticator } from "~/lib/authentication.server";
import { getProjectsByUser } from "~/models/projects.server";

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/" });
  const projects = await getProjectsByUser(user.username);

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

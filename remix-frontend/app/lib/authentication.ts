import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";

import { getProjectDetails } from "~/models/projects.server";

import { authenticator } from "./authentication.server";

export async function loaderLoginCheck(request: Request) {
  return { isLoggedIn: (await authenticator.isAuthenticated(request)) !== null };
}

export const isLoggedInLoader = async ({ request }: DataFunctionArgs) =>
  json(await loaderLoginCheck(request));

export async function isThisUserLoggedIn(request: Request, user: { id: string }) {
  const userFromSession = await authenticator.isAuthenticated(request);
  return user.id === userFromSession?.id;
}

export async function isAnyUserFromListLoggedIn(request: Request, users: { id: string }[]) {
  const userFromSession = await authenticator.isAuthenticated(request);
  return users.some(({ id }) => id === userFromSession?.id);
}

type ProjectMembersAndOwners = { members: { id: string }[]; owners: { id: string }[] };

export async function isUserAuthorizedForProject(
  request: Request,
  projectId: string
): Promise<boolean>;

export async function isUserAuthorizedForProject(
  request: Request,
  project: ProjectMembersAndOwners
): Promise<boolean>;

export async function isUserAuthorizedForProject(
  request: Request,
  projectOrProjectId: ProjectMembersAndOwners | string
) {
  const project =
    typeof projectOrProjectId === "string"
      ? await getProjectDetails(projectOrProjectId)
      : projectOrProjectId;

  invariant(project, `Project not found`);

  return (
    (await isAnyUserFromListLoggedIn(request, project.owners)) ||
    (await isAnyUserFromListLoggedIn(request, project.members))
  );
}

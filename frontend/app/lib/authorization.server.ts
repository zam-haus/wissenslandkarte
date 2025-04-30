import { User } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import invariant from "tiny-invariant";

import { getSession } from "./session.server";

type AuthorizationOptions = { ifNotLoggedInRedirectTo?: string };

export async function getLoggedInUser(request: Request): Promise<User | null>;
export async function getLoggedInUser(
  request: Request,
  options: NonNullable<AuthorizationOptions>,
): Promise<User>;
export async function getLoggedInUser(
  request: Request,
  options: AuthorizationOptions = {},
): Promise<User | null> {
  const user = (await getSession(request)).get("user") ?? null;

  if (user === null && options.ifNotLoggedInRedirectTo !== undefined) {
    throw redirect(options.ifNotLoggedInRedirectTo);
  }

  return user;
}

export async function isAnyUserLoggedIn(request: Request) {
  return (await getLoggedInUser(request)) !== null;
}

export async function loaderLoginCheck(request: Request) {
  return { isLoggedIn: await isAnyUserLoggedIn(request) };
}

export const isLoggedInLoader = async ({ request }: LoaderFunctionArgs) =>
  await loaderLoginCheck(request);

export async function isThisUserLoggedIn(request: Request, user: { id: string }) {
  const userFromSession = await getLoggedInUser(request);
  return user.id === userFromSession?.id;
}

export async function isAnyUserFromListLoggedIn(request: Request, users: { id: string }[]) {
  const userFromSession = await getLoggedInUser(request);
  return users.some(({ id }) => id === userFromSession?.id);
}

type ProjectMembersAndOwners = { members: { id: string }[]; owners: { id: string }[] };
export async function isUserAuthorizedForProject(
  request: Request,
  project: ProjectMembersAndOwners,
) {
  invariant(project, `Project not found`);

  return (
    (await isAnyUserFromListLoggedIn(request, project.owners)) ||
    (await isAnyUserFromListLoggedIn(request, project.members))
  );
}

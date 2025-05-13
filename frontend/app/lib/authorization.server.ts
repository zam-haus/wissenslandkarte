import { Prisma } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import type { roles as bootstrappedRoles } from "prisma/initialization/data/production-data-generators";

import { getSession } from "./session.server";

type AuthorizationOptions = { ifNotLoggedInRedirectTo?: string };

export type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { select: { title: true } } };
}>;

export async function getLoggedInUser(request: Request): Promise<UserWithRoles | null>;
export async function getLoggedInUser(
  request: Request,
  options: NonNullable<AuthorizationOptions>,
): Promise<UserWithRoles>;
export async function getLoggedInUser(
  request: Request,
  options: AuthorizationOptions = {},
): Promise<UserWithRoles | null> {
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

type Role = (typeof bootstrappedRoles)[number];
type PascalCase<KebabCase extends string> = KebabCase extends `${infer First}-${infer Rest}`
  ? `${PascalCase<First>}${PascalCase<Rest>}`
  : KebabCase extends `${infer InnerFirst}${infer InnerRest}`
    ? `${Uppercase<InnerFirst>}${InnerRest}`
    : KebabCase;

export const Roles = {
  UserEditor: "user-editor",
  ProjectEditor: "project-editor",
} as const satisfies { [key in PascalCase<Role>]: Role };

export async function loggedInUserHasRole(request: Request, role: Role) {
  return (await getLoggedInUser(request))?.roles.map(({ title }) => title).includes(role) ?? false;
}

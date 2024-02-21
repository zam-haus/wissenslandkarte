import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import { authenticator } from "./authentication.server";

export async function loaderLoginCheck(request: Request) {
  return { isLoggedIn: await authenticator.isAuthenticated(request) };
}

export const isLoggedInLoader: LoaderFunction = async ({ request }) =>
  json(await loaderLoginCheck(request));

export async function isThisUserLoggedIn(request: Request, user: { id: string }) {
  const userFromSession = await authenticator.isAuthenticated(request);
  return user.id === userFromSession?.id;
}

export async function isAnyUserFromListLoggedIn(request: Request, users: { id: string }[]) {
  const userFromSession = await authenticator.isAuthenticated(request);
  return users.some(({ id }) => id === userFromSession?.id);
}

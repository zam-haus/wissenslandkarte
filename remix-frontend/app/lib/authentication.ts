import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import { authenticator } from "./authentication.server";

export async function loaderLoginCheck(request: Request) {
  return { isLoggedIn: await authenticator.isAuthenticated(request) };
}

export const isLoggedInLoader: LoaderFunction = async ({ request }) =>
  json(await loaderLoginCheck(request));
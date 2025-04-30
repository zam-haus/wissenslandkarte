import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { getLoggedInUser } from "~/lib/authorization.server";

export const action = async ({ request }: LoaderFunctionArgs) => {
  const user = await getLoggedInUser(request, { ifNotLoggedInRedirectTo: "/users" });

  return redirect(`/users/${user.username}`, 303);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getLoggedInUser(request, { ifNotLoggedInRedirectTo: "/users" });

  return redirect(`/users/${user.username}`, 303);
};

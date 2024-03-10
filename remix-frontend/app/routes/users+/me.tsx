import type { LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { authenticator } from "~/lib/authentication.server";

export const action = async ({ request }: LoaderArgs) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/users" });

  return redirect(`/users/${user.username}`, 303);
};

export const loader = async ({ request }: LoaderArgs) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/users" });

  return redirect(`/users/${user.username}`, 303);
};

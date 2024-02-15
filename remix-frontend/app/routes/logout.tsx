import type { LoaderFunction } from "@remix-run/node";

import { authenticator } from "~/lib/authentication.server";

export const loader: LoaderFunction = async ({ request }) => {
  await authenticator.logout(request, { redirectTo: "/" });
};

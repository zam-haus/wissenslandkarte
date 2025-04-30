import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { getSession, tempUserSessionKey, userSessionKey } from "~/lib/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  session.set(userSessionKey, undefined);
  session.set(tempUserSessionKey, undefined);
  const headers = await session.commit();

  return redirect("/", { headers });
};

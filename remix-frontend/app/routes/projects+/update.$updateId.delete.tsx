import { type LoaderArgs, redirect } from "@remix-run/node";
import { redirectBack } from "remix-utils";
import invariant from "tiny-invariant";

import { isAnyUserFromListLoggedIn } from "~/lib/authentication";
import { deleteProjectUpdate, getProjectUpdateDetails } from "~/models/projectUpdates.server";

export const action = async ({ params, request }: LoaderArgs) => {
  invariant(params.updateId, `params.updateId is required`);

  const update = await getProjectUpdateDetails(params.updateId);
  invariant(update, `Update not found: ${params.updateId}`);

  const ownerLoggedIn = await isAnyUserFromListLoggedIn(request, update.Project?.owners ?? []);
  const memberLoggedIn = await isAnyUserFromListLoggedIn(request, update.Project?.members ?? []);

  if (!ownerLoggedIn && !memberLoggedIn) {
    return redirect("/");
  }

  await deleteProjectUpdate(params.updateId);

  return redirectBack(request, { fallback: "/projects/mine" });
};

export default function () {
  throw Error("May only be POSTED to.");
}

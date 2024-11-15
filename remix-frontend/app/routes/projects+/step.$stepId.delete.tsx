import { type LoaderArgs, redirect } from "@remix-run/node";
import { redirectBack } from "remix-utils";
import invariant from "tiny-invariant";

import { isAnyUserFromListLoggedIn } from "~/lib/authentication";
import {
  deleteProjectStep,
  getProjectStepWithProjectOwnersAndMembers,
} from "~/models/projectSteps.server";

export const action = async ({ params, request }: LoaderArgs) => {
  invariant(params.stepId, `params.stepId is required`);

  const step = await getProjectStepWithProjectOwnersAndMembers(params.stepId);
  invariant(step, `Step not found: ${params.stepId}`);

  const ownerLoggedIn = await isAnyUserFromListLoggedIn(request, step.Project?.owners ?? []);
  const memberLoggedIn = await isAnyUserFromListLoggedIn(request, step.Project?.members ?? []);

  if (!ownerLoggedIn && !memberLoggedIn) {
    return redirect("/");
  }

  await deleteProjectStep(params.stepId);

  return redirectBack(request, { fallback: "/projects/mine" });
};

export default function () {
  throw Error("May only be POSTED to.");
}

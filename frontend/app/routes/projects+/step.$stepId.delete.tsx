import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { redirectBack } from "remix-utils/redirect-back";
import invariant from "tiny-invariant";

import { isUserAuthorizedForProject } from "~/lib/authorization.server";
import {
  deleteProjectStep,
  getProjectStepWithProjectOwnersAndMembers,
} from "~/models/projectSteps.server";

export const action = async ({ params, request }: LoaderFunctionArgs) => {
  invariant(params.stepId, `params.stepId is required`);

  const step = await getProjectStepWithProjectOwnersAndMembers(params.stepId);
  invariant(step, `Step not found: ${params.stepId}`);
  invariant(step.project, `Step without project: ${params.stepId}`);

  if (!(await isUserAuthorizedForProject(request, step.project))) {
    return redirect("/");
  }

  await deleteProjectStep(params.stepId);

  return redirectBack(request, { fallback: "/projects/mine" });
};

export default function () {
  throw Error("May only be POSTED to.");
}

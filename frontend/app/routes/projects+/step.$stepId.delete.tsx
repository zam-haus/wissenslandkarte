import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { serverOnly$ } from "vite-env-only/macros";

import {
  deleteProjectStep,
  getProjectStepWithProjectOwnersAndMembers,
} from "~/database/repositories/projectSteps.server";
import { isAnyUserFromListLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404, assertExistsOr500 } from "~/lib/dataValidation";
import { logger } from "~/lib/logging.server";

// Only use in server functions!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const assertAuthorization = serverOnly$(
  async (
    request: Request,
    project: { id: string; owners: { id: string }[]; members: { id: string }[] },
  ) => {
    const isOwnerLoggedIn = await isAnyUserFromListLoggedIn(request, project.owners);
    const isMemberLoggedIn = await isAnyUserFromListLoggedIn(request, project.members);
    const isProjectAdminLoggedIn = await loggedInUserHasRole(request, Roles.ProjectEditor);

    if (!(isOwnerLoggedIn || isMemberLoggedIn || isProjectAdminLoggedIn)) {
      logger("step-delete").warn(
        `Someone tried deleting step from project ${project.id} but was not authorized to do so`,
      );
      throw redirect("/");
    }
  },
)!;

export const action = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.stepId, `Missing step id`);

  const step = await getProjectStepWithProjectOwnersAndMembers(params.stepId);
  assertExistsOr404(step, `Step not found: ${params.stepId}`);
  assertExistsOr500(step.project, `Step without project: ${params.stepId}`);

  await assertAuthorization(request, step.project);

  await deleteProjectStep(params.stepId);

  return redirect("/projects/" + step.project.id);
};

export default function () {
  throw Error("May only be POSTED to.");
}

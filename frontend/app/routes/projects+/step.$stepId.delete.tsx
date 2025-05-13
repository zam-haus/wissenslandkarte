import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import invariant from "tiny-invariant";
import { serverOnly$ } from "vite-env-only/macros";

import { isAnyUserFromListLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import {
  deleteProjectStep,
  getProjectStepWithProjectOwnersAndMembers,
} from "~/models/projectSteps.server";

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
      console.warn(
        `Someone tried deleting step from project ${project.id} but was not authorized to do so`,
      );
      throw redirect("/");
    }
  },
)!;

export const action = async ({ params, request }: LoaderFunctionArgs) => {
  invariant(params.stepId, `params.stepId is required`);

  const step = await getProjectStepWithProjectOwnersAndMembers(params.stepId);
  invariant(step, `Step not found: ${params.stepId}`);
  invariant(step.project, `Step without project: ${params.stepId}`);

  await assertAuthorization(request, step.project);

  await deleteProjectStep(params.stepId);

  return redirect("/projects/" + step.project.id);
};

export default function () {
  throw Error("May only be POSTED to.");
}

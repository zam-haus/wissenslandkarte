import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import { Handle } from "types/handle";
import { finalizeProject, getProjectDetails } from "~/database/repositories/projects.server";
import { isAnyUserFromListLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";
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
      logger("project-finalize").warn(
        `Someone tried finalizing project ${project.id} but was not authorized to do so`,
      );
      throw redirect("/");
    }
  },
)!;

export const action = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.projectId, `Missing project id`);

  const project = await getProjectDetails(params.projectId);
  assertExistsOr404(project, `Project not found: ${params.projectId}`);

  await assertAuthorization(request, project);

  await finalizeProject(project.id);

  return redirect(`/projects/${project.id}`);
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.projectId, `Missing project id`);

  const project = await getProjectDetails(params.projectId);
  assertExistsOr404(project, `Project not found: ${params.projectId}`);

  await assertAuthorization(request, project);

  return { title: project.title };
};

export const handle: Handle<"projects"> = {
  pageTitleOverride: { ns: "projects", key: "titles.single-project-finalize" },
};

export default function ProjectFinalize() {
  const { title } = useLoaderData<typeof loader>();
  const { t } = useTranslation("projects");

  return (
    <Form method="post">
      <p>{t("finalize.confirmation-prompt", { title })}</p>
      <button type="submit">{t("finalize.confirmation-response-yes")}</button>
    </Form>
  );
}

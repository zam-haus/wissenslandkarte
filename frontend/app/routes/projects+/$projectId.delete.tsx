import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import { deleteProject, getProjectDetails } from "~/database/repositories/projects.server";
import { isAnyUserFromListLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";
import { logger } from "~/lib/logging.server";
import { deleteS3Files } from "~/lib/storage/s3Management.server";

import { deleteAttachmentFiles } from "./lib/deleteAttachments.server";

// Only use in server functions!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const assertAuthorization = serverOnly$(
  async (
    request: Request,
    project: { id: string; owners: { id: string }[]; members: { id: string }[] },
  ) => {
    const isOwnerLoggedIn = await isAnyUserFromListLoggedIn(request, project.owners);
    const isProjectAdminLoggedIn = await loggedInUserHasRole(request, Roles.ProjectEditor);

    if (!(isOwnerLoggedIn || isProjectAdminLoggedIn)) {
      logger("project-delete").warn(
        `Someone tried deleting project ${project.id} but was not authorized to do so`,
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

  const allAttachments = [
    ...project.attachments,
    ...project.steps.flatMap((step) => step.attachments),
  ];

  await deleteAttachmentFiles(allAttachments);
  await deleteS3Files(project.mainImage ? [project.mainImage] : []);
  await deleteProject(params.projectId);

  return redirect("?success=true&title=" + project.title);
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.projectId, `Missing project id`);

  const url = new URL(request.url);
  if (url.searchParams.get("success") === "true") {
    return { success: true, title: url.searchParams.get("title") ?? "" };
  }

  const project = await getProjectDetails(params.projectId);
  assertExistsOr404(project, `Project not found: ${params.projectId}`);

  await assertAuthorization(request, project);

  return { title: project.title };
};

export default function ProjectDelete() {
  const { title, success } = useLoaderData<typeof loader>();
  const { t } = useTranslation("projects");

  if (success) {
    return (
      <div>
        <h2>{t("delete.project-deleted")}</h2>
        <p>{t("delete.project-deleted-message", { title })}</p>
        <Link to="/projects/mine">{t("delete.back-to-projects")}</Link>
      </div>
    );
  }

  return (
    <Form method="post">
      <p>{t("delete.confirmation-prompt", { title })} </p>
      <button type="submit">{t("delete.confirmation-response-yes")}</button>
    </Form>
  );
}

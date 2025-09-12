import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import {
  getProjectDetails,
  getProjectsByUser,
  ProjectListEntry,
  updateProjectLatestModificationDate,
} from "~/database/repositories/projects.server";
import { createProjectStep } from "~/database/repositories/projectSteps.server";
import {
  getLoggedInUser,
  isAnyUserFromListLoggedIn,
  loggedInUserHasRole,
  Roles,
} from "~/lib/authorization.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import { assertExistsOr400 } from "~/lib/dataValidation";
import { logger } from "~/lib/logging.server";
import { upsertProjectStepToSearchIndex } from "~/lib/search/search.server";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/storage/constants";
import { parseMultipartFormDataUploadFilesToS3 } from "~/lib/upload/pipeline.server";

import { getStringArray, getTrimmedStringsDefaultEmpty } from "../../lib/formDataParser";

import { StepForm } from "./components/step-form";
import { storeAttachmentsS3ObjectPurposes } from "./lib/storeS3ObjectPurpose.server";

const FIELD_EMPTY = "FIELD_EMPTY";
const CREATE_FAILED = "CREATE_FAILED";

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
      logger("step-new").warn(
        `Someone tried creating a new step for project ${project.id} but was not authorized to do so`,
      );
      throw redirect("/");
    }
  },
)!;

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<never> | { error: string; exception?: string }> => {
  assertExistsOr400(params.projectId, `Missing project id`);

  const { projectId } = params;

  const project = await getProjectDetails(projectId);
  if (project === null) {
    return {
      error: CREATE_FAILED,
      exception: "No such project",
    };
  }

  await assertAuthorization(request, project);

  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["imageAttachments"]);
  const { description } = getTrimmedStringsDefaultEmpty(formData, "description");
  const { imageAttachments } = getStringArray(formData, "imageAttachments");

  if (description.length === 0) {
    return {
      error: FIELD_EMPTY,
    };
  }
  try {
    const result = await createProjectStep({
      description,
      projectId,
      imageAttachmentUrls: imageAttachments,
    });

    await updateProjectLatestModificationDate(projectId);

    storeAttachmentsS3ObjectPurposes(imageAttachments, result.attachments, logger("step-new"));

    await upsertProjectStepToSearchIndex(result);

    return redirect(`/projects/${projectId}`);
  } catch (e: unknown) {
    if (!(e instanceof Error)) {
      return { error: CREATE_FAILED };
    }
    return {
      error: CREATE_FAILED,
      exception: e.message,
    };
  }
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  assertExistsOr400(params.projectId);

  const project = await getProjectDetails(params.projectId);
  if (project === null) {
    return {
      error: CREATE_FAILED,
      exception: "No such project",
    };
  }
  await assertAuthorization(request, project);
  const isAdminCreatingStep = !(await isAnyUserFromListLoggedIn(request, [
    ...project.owners,
    ...project.members,
  ]));

  let projects: ProjectListEntry[] = [];
  if (isAdminCreatingStep) {
    projects = [project];
  } else {
    const user = await getLoggedInUser(request, { ifNotLoggedInRedirectTo: "/" });
    projects = await getProjectsByUser(user.username);
  }

  return { projects, projectId: params.projectId };
};

export default function CreateStep() {
  const { projects, projectId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation("projects");

  if (projects === undefined) {
    return <main>{t("steps-create-edit.no-such-project")}</main>;
  }

  const projectsWithDates = [...projects];
  projectsWithDates.sort(descendingByDatePropertyComparator("latestModificationDate"));

  return (
    <main>
      {actionData?.error === FIELD_EMPTY ? (
        <div>{t("steps-create-edit.missing-description")}</div>
      ) : null}
      {actionData?.error === CREATE_FAILED ? (
        <div>
          {t("steps-create-edit.creation-failed")} {actionData.exception}
        </div>
      ) : null}

      <StepForm
        action=""
        maxImageSize={MAX_UPLOAD_SIZE_IN_BYTE}
        projectsWithDates={projectsWithDates}
        projectId={projectId}
        mode="create"
      ></StepForm>
    </main>
  );
}

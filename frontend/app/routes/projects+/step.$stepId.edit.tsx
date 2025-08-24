import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import { getProjectDetails, getProjectsByUser } from "~/database/repositories/projects.server";
import {
  getEditableProjectStepDetails,
  updateProjectStep,
} from "~/database/repositories/projectSteps.server";
import {
  getLoggedInUser,
  isAnyUserFromListLoggedIn,
  loggedInUserHasRole,
  Roles,
} from "~/lib/authorization.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import { assertExistsOr400, assertExistsOr404, assertExistsOr500 } from "~/lib/dataValidation";
import { logger } from "~/lib/logging.server";
import { upsertProjectStepToSearchIndex } from "~/lib/search.server";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/storage/constants";
import { deleteS3FilesByPublicUrl } from "~/lib/storage/s3Deletion.server";
import { parseMultipartFormDataUploadFilesToS3 } from "~/lib/upload/pipeline.server";

import { getStringArray, getTrimmedStringsDefaultEmpty } from "../../lib/formDataParser";

import { StepForm } from "./components/step-form";
import { deleteAttachmentFilesByIds } from "./lib/deleteAttachments.server";
import { storeAttachmentsS3ObjectPurposes } from "./lib/storeS3ObjectPurpose.server";

const FIELD_EMPTY = "FIELD_EMPTY";
const UPDATE_FAILED = "UPDATE_FAILED";

// Only use in server functions!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const assertAuthorization = serverOnly$(
  async (
    request: Request,
    project: { owners: { id: string }[]; members: { id: string }[] },
    warning: string,
  ) => {
    const isOwnerLoggedIn = await isAnyUserFromListLoggedIn(request, project.owners);
    const isMemberLoggedIn = await isAnyUserFromListLoggedIn(request, project.members);
    const isProjectAdminLoggedIn = await loggedInUserHasRole(request, Roles.ProjectEditor);

    if (!(isOwnerLoggedIn || isMemberLoggedIn || isProjectAdminLoggedIn)) {
      logger("step-edit").warn(warning);
      throw redirect("/");
    }
  },
)!;

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<never> | { error: string; exception?: string }> => {
  assertExistsOr400(params.stepId, `Missing step id`);

  const step = await getEditableProjectStepDetails(params.stepId);
  if (step === null || step.project === null) {
    return {
      error: UPDATE_FAILED,
      exception: "No such step or no such project",
    };
  }
  const project = step.project;
  await assertAuthorization(
    request,
    project,
    `Someone tried editing step ${params.stepId} but was not authorized to do so!`,
  );

  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["imageAttachments"]);

  const { newProjectId, description } = getTrimmedStringsDefaultEmpty(
    formData,
    "newProjectId",
    "description",
  );
  const { imageAttachments, attachmentsToRemove } = getStringArray(
    formData,
    "imageAttachments",
    "attachmentsToRemove",
  );

  if (description.length === 0) {
    await deleteS3FilesByPublicUrl(imageAttachments);
    return {
      error: FIELD_EMPTY,
    };
  }
  if (project.id !== newProjectId) {
    const newProject = await getProjectDetails(newProjectId);
    if (newProject === null) {
      await deleteS3FilesByPublicUrl(imageAttachments);
      return {
        error: UPDATE_FAILED,
        exception: "No such new project",
      };
    }

    await assertAuthorization(
      request,
      newProject,
      `Someone tried assigning step ${params.stepId} to project ${newProjectId} but was not authorized to do so!`,
    );
  }

  try {
    await deleteAttachmentFilesByIds(attachmentsToRemove);

    const result = await updateProjectStep(params.stepId, {
      description,
      projectId: newProjectId,
      imageAttachmentUrls: imageAttachments,
      attachmentsToRemove,
    });

    storeAttachmentsS3ObjectPurposes(imageAttachments, result.attachments, logger("step-edit"));
    await upsertProjectStepToSearchIndex(result);

    return redirect(`/projects/${result.projectId}`);
  } catch (e: unknown) {
    if (!(e instanceof Error)) {
      return { error: UPDATE_FAILED };
    }
    return {
      error: UPDATE_FAILED,
      exception: e.message,
    };
  }
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  assertExistsOr400(params.stepId, `Missing step id`);
  const user = await getLoggedInUser(request, { ifNotLoggedInRedirectTo: "/" });

  const projects = await getProjectsByUser(user.username);
  const currentState = await getEditableProjectStepDetails(params.stepId);

  assertExistsOr404(currentState, "No such step");
  assertExistsOr500(currentState.project, "Could not load step's project");

  await assertAuthorization(
    request,
    currentState.project,
    `Someone tried editing step ${params.stepId} but was not authorized to do so!`,
  );

  return { projects, currentState, projectId: currentState.project.id };
};

export default function EditStep() {
  const { projects, currentState, projectId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation("projects");

  if (projects.length === 0) {
    return <main>{t("no-projects")}</main>;
  }

  const projectsWithDates = projects;
  projectsWithDates.sort(descendingByDatePropertyComparator("latestModificationDate"));

  return (
    <main>
      {actionData?.error === FIELD_EMPTY ? <div>{t("missing-description")}</div> : null}
      {actionData?.error === UPDATE_FAILED ? (
        <div>
          {t("creation-failed")} {actionData.exception}
        </div>
      ) : null}

      <StepForm
        action=""
        maxImageSize={MAX_UPLOAD_SIZE_IN_BYTE}
        projectsWithDates={projectsWithDates}
        projectId={projectId}
        mode="edit"
        currentState={currentState}
      ></StepForm>
    </main>
  );
}

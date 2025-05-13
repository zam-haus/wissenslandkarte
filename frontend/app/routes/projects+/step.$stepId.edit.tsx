import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import {
  getLoggedInUser,
  isAnyUserFromListLoggedIn,
  loggedInUserHasRole,
  Roles,
} from "~/lib/authorization.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import { assertExistsOr400, assertExistsOr404, assertExistsOr500 } from "~/lib/dataValidation";
import { upsertProjectStepToSearchIndex } from "~/lib/search.server";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/upload/constants";
import { parseMultipartFormDataUploadFilesToS3 } from "~/lib/upload/pipeline.server";
import { getProjectDetails, getProjectsByUser } from "~/models/projects.server";
import { getEditableProjectStepDetails, updateProjectStep } from "~/models/projectSteps.server";

import { getStringArray, getTrimmedStringsDefaultEmpty } from "../../lib/formDataParser";

import { StepForm } from "./components/step-form";

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
      console.warn(warning);
      throw redirect("/");
    }
  },
)!;

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): Promise<TypedResponse<never> | { error: string; exception?: string }> => {
  assertExistsOr400(params.stepId, `Missing step id`);

  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["imageAttachments"]);

  const { projectId: newProjectId, description } = getTrimmedStringsDefaultEmpty(
    formData,
    "projectId",
    "description",
  );
  const { imageAttachments, attachmentsToRemove } = getStringArray(
    formData,
    "imageAttachments",
    "attachmentsToRemove",
  );

  if (description.length === 0) {
    return {
      error: FIELD_EMPTY,
    };
  }

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

  if (project.id !== newProjectId) {
    const newProject = await getProjectDetails(newProjectId);
    if (newProject === null) {
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
    const result = await updateProjectStep(params.stepId, {
      description,
      projectId: newProjectId,
      imageAttachmentUrls: imageAttachments,
      attachmentsToRemove,
    });

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

  return { projects, currentState };
};

export const handle = {
  i18n: ["projects"],
};

export default function EditStep() {
  const currentPath = ".";
  const { projects, currentState } = useLoaderData<typeof loader>();
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
        action={currentPath}
        maxImageSize={MAX_UPLOAD_SIZE_IN_BYTE}
        projectsWithDates={projectsWithDates}
        mode="edit"
        currentState={currentState}
      ></StepForm>
    </main>
  );
}

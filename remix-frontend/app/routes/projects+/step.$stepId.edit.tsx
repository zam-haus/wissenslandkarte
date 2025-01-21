import type { ActionArgs, LoaderArgs, TypedResponse } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { mapDeserializedDates } from "~/components/date-rendering";
import { isUserAuthorizedForProject } from "~/lib/authentication";
import { authenticator } from "~/lib/authentication.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/upload/handler-s3.server";
import { parseMultipartFormDataUploadFilesToS3 } from "~/lib/upload/pipeline.server";
import { getProjectDetails, getProjectsByUser } from "~/models/projects.server";
import { getEditableProjectStepDetails, updateProjectStep } from "~/models/projectSteps.server";

import { StepForm } from "./components/step-form";
import { getStringArray, getTrimmedStringsDefaultEmpty } from "./lib/formDataParser";

const FIELD_EMPTY = "FIELD_EMPTY";
const UPDATE_FAILED = "UPDATE_FAILED";

export const action = async ({
  request,
  params,
}: ActionArgs): Promise<TypedResponse<{ error: string; exception?: string }>> => {
  invariant(params.stepId, `params.stepId is required`);

  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["photoAttachments"]);

  const { projectId: newProjectId, description } = getTrimmedStringsDefaultEmpty(
    formData,
    "projectId",
    "description"
  );
  const { photoAttachments, attachmentsToRemove } = getStringArray(
    formData,
    "photoAttachments",
    "attachmentsToRemove"
  );

  if (description.length === 0) {
    return json({
      error: FIELD_EMPTY,
    });
  }

  const step = await getEditableProjectStepDetails(params.stepId);
  if (step === null || step.project === null) {
    return json({
      error: UPDATE_FAILED,
      exception: "No such step or no such project",
    });
  }
  const project = step.project;
  if (!(await isUserAuthorizedForProject(request, project))) {
    // TODO: at this point the image files are already uploaded. we have to authorize the user earlier.
    console.warn(`Someone tried editing step ${params.stepId} but was not authorized to do so!`);
    return redirect("/");
  }

  if (project.id !== newProjectId) {
    const newProject = await getProjectDetails(newProjectId);
    if (newProject === null) {
      return json({
        error: UPDATE_FAILED,
        exception: "No such new project",
      });
    }
    if (!(await isUserAuthorizedForProject(request, newProject))) {
      console.warn(
        `Someone tried assigning step ${params.stepId} to project ${newProjectId} but was not authorized to do so!`
      );
      return redirect("/");
    }
  }

  try {
    const result = await updateProjectStep(params.stepId, {
      description,
      projectId: newProjectId,
      photoAttachmentUrls: photoAttachments,
      attachmentsToRemove,
    });
    return redirect(`/projects/${result.projectId}`);
  } catch (e: any) {
    return json({
      error: UPDATE_FAILED,
      exception: e.message,
    });
  }
};

export const loader = async ({ request, params }: LoaderArgs) => {
  invariant(params.stepId, `params.stepId is required`);
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/" });

  const projects = await getProjectsByUser(user.username);
  const currentState = await getEditableProjectStepDetails(params.stepId);

  invariant(currentState, "Could not load project step");
  invariant(currentState.project, "Could not load step's project");

  if (!(await isUserAuthorizedForProject(request, currentState.project))) {
    console.warn(`Someone tried editing step ${params.stepId} but was not authorized to do so!`);
    return redirect("/");
  }

  return json({ projects, currentState, maxPhotoSize: MAX_UPLOAD_SIZE_IN_BYTE });
};

export const handle = {
  i18n: ["projects"],
};

export default function EditStep() {
  const currentPath = ".";
  const { projects, maxPhotoSize, currentState } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation("projects");

  if (projects.length === 0) {
    return <main>{t("no-projects")}</main>;
  }

  const projectsWithDates = projects.map(mapDeserializedDates("latestModificationDate"));
  projectsWithDates.sort(descendingByDatePropertyComparator("latestModificationDate"));

  return (
    <main>
      {actionData?.error === FIELD_EMPTY ? <div>{t("missing-description")}</div> : null}
      {actionData?.error === UPDATE_FAILED ? (
        <div>
          {t("creation-failed")} {actionData?.exception}
        </div>
      ) : null}

      <StepForm
        action={currentPath}
        maxPhotoSize={maxPhotoSize}
        projectsWithDates={projectsWithDates}
        mode="edit"
        currentState={currentState}
      ></StepForm>
    </main>
  );
}

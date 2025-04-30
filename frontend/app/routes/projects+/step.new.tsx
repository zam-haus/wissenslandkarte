import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { mapDeserializedDates } from "~/components/date-rendering";
import { getLoggedInUser, isUserAuthorizedForProject } from "~/lib/authorization.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import { upsertProjectStepToSearchIndex } from "~/lib/search.server";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/upload/constants";
import { parseMultipartFormDataUploadFilesToS3 } from "~/lib/upload/pipeline.server";
import { getProjectDetails, getProjectsByUser } from "~/models/projects.server";
import { createProjectStep } from "~/models/projectSteps.server";

import { getStringArray, getTrimmedStringsDefaultEmpty } from "../../lib/formDataParser";

import { StepForm } from "./components/step-form";

const FIELD_EMPTY = "FIELD_EMPTY";
const CREATE_FAILED = "CREATE_FAILED";

export const action = async ({
  request,
}: ActionFunctionArgs): Promise<TypedResponse<never> | { error: string; exception?: string }> => {
  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["photoAttachments"]);

  const { projectId, description } = getTrimmedStringsDefaultEmpty(
    formData,
    "projectId",
    "description",
  );
  const { photoAttachments } = getStringArray(formData, "photoAttachments");

  if (description.length === 0) {
    return {
      error: FIELD_EMPTY,
    };
  }

  const project = await getProjectDetails(projectId);
  if (project === null) {
    return {
      error: CREATE_FAILED,
      exception: "No such project",
    };
  }

  if (!(await isUserAuthorizedForProject(request, project))) {
    // TODO: at this point the file is already uploaded. we have to authorize the user earlier.
    console.warn(
      `Someone tried creating a new step for project ${projectId} but was not authorized to do so!`,
    );
    return redirect("/");
  }

  try {
    const result = await createProjectStep({
      description,
      projectId,
      photoAttachmentUrls: photoAttachments,
    });

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getLoggedInUser(request, { ifNotLoggedInRedirectTo: "/" });

  const projects = await getProjectsByUser(user.username);

  return { projects };
};

export const handle = {
  i18n: ["projects"],
};

export default function CreateStep() {
  const currentPath = "/projects/step/new";
  const { projects } = useLoaderData<typeof loader>();
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
      {actionData?.error === CREATE_FAILED ? (
        <div>
          {t("creation-failed")} {actionData.exception}
        </div>
      ) : null}

      <StepForm
        action={currentPath}
        maxPhotoSize={MAX_UPLOAD_SIZE_IN_BYTE}
        projectsWithDates={projectsWithDates}
        mode="create"
      ></StepForm>
    </main>
  );
}

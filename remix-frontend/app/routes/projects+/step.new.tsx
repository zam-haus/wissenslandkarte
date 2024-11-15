import type { ActionArgs, LoaderArgs, TypedResponse } from "@remix-run/node";
import {
  json,
  redirect,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { mapDeserializedDates } from "~/components/date-rendering";
import { isAnyUserFromListLoggedIn } from "~/lib/authentication";
import { authenticator } from "~/lib/authentication.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import { createS3UploadHandler, MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/s3.server";
import { getProjectDetails, getProjectsByUser } from "~/models/projects.server";
import { createProjectStep } from "~/models/projectSteps.server";

import { StepForm } from "./components/step-form";
import { getStringArray, getTrimmedStringsDefaultEmpty } from "./lib/formDataParser";

const FIELD_EMPTY = "FIELD_EMPTY";
const CREATE_FAILED = "CREATE_FAILED";

export const action = async ({
  request,
}: ActionArgs): Promise<TypedResponse<{ error: string; exception?: string }>> => {
  const formData = await parseMultipartFormData(
    request,
    composeUploadHandlers(createS3UploadHandler(["photoAttachments"]), createMemoryUploadHandler())
  );

  const { projectId, description } = getTrimmedStringsDefaultEmpty(
    formData,
    "projectId",
    "description"
  );
  const { photoAttachments } = getStringArray(formData, "photoAttachments");

  if (description.length === 0) {
    return json({
      error: FIELD_EMPTY,
    });
  }

  const project = await getProjectDetails(projectId);
  if (project === null) {
    return json({
      error: CREATE_FAILED,
      exception: "No such project",
    });
  }
  const ownerLoggedIn = await isAnyUserFromListLoggedIn(request, project.owners); // TODO: at this point the file is already uploaded. we have to authorize the user earlier.
  const memberLoggedIn = await isAnyUserFromListLoggedIn(request, project.members);
  if (!ownerLoggedIn && !memberLoggedIn) {
    console.warn(
      `Someone tried creating a new step for project ${projectId} but was not authorized to do so!`
    );
    return redirect("/");
  }

  try {
    const result = await createProjectStep({
      description,
      projectId,
      photoAttachmentUrls: photoAttachments,
    });
    return redirect(`/projects/${result.id}`);
  } catch (e: any) {
    return json({
      error: CREATE_FAILED,
      exception: e.message,
    });
  }
};

export const loader = async ({ request }: LoaderArgs) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/" });

  const projects = await getProjectsByUser(user.username);

  return json({ projects, maxPhotoSize: MAX_UPLOAD_SIZE_IN_BYTE });
};

export const handle = {
  i18n: ["projects"],
};

export default function CreateStep() {
  const currentPath = "/projects/step/new";
  const { projects, maxPhotoSize } = useLoaderData<typeof loader>();
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
          {t("creation-failed")} {actionData?.exception}
        </div>
      ) : null}

      <StepForm
        action={currentPath}
        maxPhotoSize={maxPhotoSize}
        projectsWithDates={projectsWithDates}
        mode="create"
        t={t}
      ></StepForm>
    </main>
  );
}

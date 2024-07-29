import type { LoaderArgs, TypedResponse } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { mapDeserializedDates } from "~/components/date-rendering";
import { authenticator } from "~/lib/authentication.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/s3.server";
import { getProjectsByUser } from "~/models/projects.server";
import { getEditableProjectUpdateDetails } from "~/models/projectUpdates.server";

import { UpdateForm } from "./components/update-form";

const FIELD_EMPTY = "FIELD_EMPTY";
const CREATE_FAILED = "CREATE_FAILED";

export const action = async (/*{}:ActionArgs */): Promise<
  TypedResponse<{ error: string; exception?: string }>
> => {
  throw Error("TODO");
  /*
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
    return redirect("/");
  }

  try {
    const result = await createProjectUpdate({
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
  }*/
};

export const loader = async ({ request, params }: LoaderArgs) => {
  invariant(params.updateId, `params.updateId is required`);
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/" });

  const projects = await getProjectsByUser(user.username);
  const currentState = await getEditableProjectUpdateDetails(params.updateId);

  invariant(currentState, "Could not load project update");
  invariant(currentState.Project, "Could not load project update");

  return json({ projects, currentState, maxPhotoSize: MAX_UPLOAD_SIZE_IN_BYTE });
};

export const handle = {
  i18n: ["projects"],
};

export default function EditUpdate() {
  const currentPath = location.pathname;
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
      {actionData?.error === CREATE_FAILED ? (
        <div>
          {t("creation-failed")} {actionData?.exception}
        </div>
      ) : null}

      <UpdateForm
        action={currentPath}
        maxPhotoSize={maxPhotoSize}
        projectsWithDates={projectsWithDates}
        mode="update"
        currentState={currentState}
        t={t}
      ></UpdateForm>
    </main>
  );
}

import type { ActionArgs, LoaderArgs, TypedResponse } from "@remix-run/node";
import {
  json,
  redirect,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { mapDeserializedDates } from "~/components/date-rendering";
import { ImageSelect } from "~/components/form-input/image-select";
import { isAnyUserFromListLoggedIn } from "~/lib/authentication";
import { authenticator } from "~/lib/authentication.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import { createS3UploadHandler, MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/s3.server";
import {
  createProjectUpdate,
  getProjectDetails,
  getProjectsByUser,
} from "~/models/projects.server";

import style from "./new.module.css";

const FIELD_EMPTY = "FIELD_EMPTY";
const CREATE_FAILED = "CREATE_FAILED";

export const action = async ({
  request,
}: ActionArgs): Promise<TypedResponse<{ error: string; exception?: string }>> => {
  const urlFormDataToString = (url: FormDataEntryValue | null) =>
    url === null || typeof url !== "string" || url?.length === 0 ? undefined : url.toString();

  const formData = await parseMultipartFormData(
    request,
    composeUploadHandlers(createS3UploadHandler(["photo-attachments"]), createMemoryUploadHandler())
  );
  const projectId = (formData.get("projectId") ?? "").toString().trim();
  const description = (formData.get("description") ?? "").toString().trim();

  const photoAttachmentUrls = formData
    .getAll("photo-attachments")
    .map(urlFormDataToString)
    .filter((s): s is string => s !== undefined);

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
      photoAttachmentUrls,
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

export default function NewProject() {
  const currentPath = "/projects/new-update";
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

      <Form
        method="post"
        action={currentPath}
        encType="multipart/form-data"
        className={style.verticalForm}
      >
        <label>
          {t("project-name")}
          <select name="projectId" required>
            {projectsWithDates.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>

        <ImageSelect
          name="photo-attachments"
          t={t}
          label={`${t("select-photo")} ${t("optional")}`}
          maxPhotoSize={maxPhotoSize}
          multiple={true}
        />

        <label>
          {t("update-text")}
          <textarea name="description" required></textarea>
        </label>

        <button type="submit">{t("save")}</button>
      </Form>
    </main>
  );
}

import type { ActionArgs, TypedResponse } from "@remix-run/node";
import { type LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { mapDeserializedDates, withDeserializedDates } from "~/components/date-rendering";
import { isUserAuthorizedForProject } from "~/lib/authentication";
import { authenticator } from "~/lib/authentication.server";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/upload/handler-s3.server";
import { parseMultipartFormDataUploadFilesToS3 } from "~/lib/upload/pipeline.server";
import { getProjectDetails, updateProject } from "~/models/projects.server";
import {
  loaderForTagFetcher,
  loaderForUserFetcher,
} from "~/routes/projects+/lib/loader-helpers.server";

import { ProjectForm } from "./components/project-form";
import {
  getBooleanDefaultFalse,
  getStringArray,
  getStringsDefaultUndefined,
  getTrimmedStringsDefaultEmpty,
} from "./lib/formDataParser";

const FIELD_EMPTY = "FIELD_EMPTY";
const UPDATE_FAILED = "UPDATE_FAILED";

export const action = async ({
  params,
  request,
}: ActionArgs): Promise<TypedResponse<{ error: string; exception?: string }>> => {
  invariant(params.projectId, `params.slug is required`);

  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/" });

  if (!(await isUserAuthorizedForProject(request, params.projectId))) {
    return redirect("/");
  }

  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["mainPhoto"]);

  const { title, description } = getTrimmedStringsDefaultEmpty(formData, "title", "description");
  if (title.length === 0 || description.length === 0) {
    return json({
      error: FIELD_EMPTY,
    });
  }

  try {
    const result = await updateProject(
      {
        id: params.projectId,
        title,
        description,
        owners: [user.username],
        ...getStringArray(formData, "coworkers", "tags"),
        ...getStringsDefaultUndefined(formData, "mainPhoto"),
        ...getBooleanDefaultFalse(formData, "needProjectSpace"),
      },
      { removePhotoIfNoNewValueGiven: Boolean(formData.get("removeMainPhoto")) }
    );
    return redirect(`/projects/${result.id}`);
  } catch (e: any) {
    return json({
      error: UPDATE_FAILED,
      exception: e.message,
    });
  }
};

export const loader = async ({ params, request }: LoaderArgs) => {
  invariant(params.projectId, `params.slug is required`);

  const project = await getProjectDetails(params.projectId);
  invariant(project, `Project not found: ${params.projectId}`);

  if (!(await isUserAuthorizedForProject(request, project))) {
    return redirect("/");
  }

  const searchParams = new URL(request.url).searchParams;
  const [tags, users] = await Promise.all([
    loaderForTagFetcher(searchParams),
    loaderForUserFetcher(searchParams),
  ]);

  const tagsByProject = tags.map(({ id, name, _count }) => ({
    id,
    name,
    priority: _count.projects,
  }));

  return json({ tags: tagsByProject, users, project, maxPhotoSize: MAX_UPLOAD_SIZE_IN_BYTE });
};

export const handle = {
  i18n: ["projects"],
};

export default function EditProject() {
  const { project: serializedProject, tags, users, maxPhotoSize } = useLoaderData<typeof loader>();
  const { t } = useTranslation("projects");

  const tagFetcher = useFetcher<typeof loader>();
  const userFetcher = useFetcher<typeof loader>();
  const actionData = useActionData<typeof action>();

  const project = withDeserializedDates(
    {
      ...serializedProject,
      attachments: serializedProject.attachments.map(mapDeserializedDates(["creationDate"])),
    },
    ["creationDate", "latestModificationDate"]
  );

  return (
    <main>
      {actionData?.error === FIELD_EMPTY ? <div>{t("missing-name-or-description")}</div> : null}
      {actionData?.error === UPDATE_FAILED ? (
        <div>
          {t("creation-failed")} {actionData?.exception}
        </div>
      ) : null}
      <ProjectForm
        action={undefined} // undefined means current url
        mode="edit"
        users={users}
        tags={tags}
        maxPhotoSize={maxPhotoSize}
        currentState={project}
        tagFetcher={tagFetcher}
        userFetcher={userFetcher}
      />
    </main>
  );
}

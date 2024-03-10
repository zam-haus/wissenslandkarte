import type { ActionArgs, TypedResponse } from "@remix-run/node";
import { type LoaderArgs } from "@remix-run/node";
import {
  json,
  redirect,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";
import { Form, useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { ImageSelect } from "~/components/form-input/image-select";
import { TagSelect } from "~/components/form-input/tag-select";
import { UserSelect } from "~/components/form-input/user-select";
import { isAnyUserFromListLoggedIn } from "~/lib/authentication";
import { authenticator } from "~/lib/authentication.server";
import { createS3UploadHandler, MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/s3.server";
import { getProjectDetails, updateProject } from "~/models/projects.server";
import {
  loaderForTagFetcher,
  loaderForUserFetcher,
} from "~/routes/projects+/lib/loader-helpers.server";

import style from "./$projectId.edit.module.css";
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

  const formData = await parseMultipartFormData(
    request,
    composeUploadHandlers(createS3UploadHandler(["main-photo"]), createMemoryUploadHandler())
  );

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

  const ownerLoggedIn = await isAnyUserFromListLoggedIn(request, project.owners);
  const memberLoggedIn = await isAnyUserFromListLoggedIn(request, project.members);
  if (!ownerLoggedIn && !memberLoggedIn) {
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
  const { project, tags, users, maxPhotoSize } = useLoaderData<typeof loader>();
  const { t } = useTranslation("projects");

  const tagFetcher = useFetcher<typeof loader>();
  const userFetcher = useFetcher<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <main>
      {actionData?.error === FIELD_EMPTY ? <div>{t("missing-name-or-description")}</div> : null}
      {actionData?.error === UPDATE_FAILED ? (
        <div>
          {t("creation-failed")} {actionData?.exception}
        </div>
      ) : null}

      <Form method="post" className={style.verticalForm} encType="multipart/form-data">
        <label>
          {t("project-name")} {t("required")}
          <input name="title" type="text" defaultValue={project.title} required />
        </label>

        <label>
          {t("project-description")} {t("required")}
          <textarea name="description" required defaultValue={project.description}></textarea>
        </label>

        {project.mainPhoto === null ? null : (
          <>
            {t("current-main-photo")}
            <img className={style.mainPhoto} src={project.mainPhoto} alt={t("main-photo")} />
            Remove main photo: <input type="checkbox" name="removeMainPhoto" />{" "}
            {/*autoset and hide when image removal is done*/}
          </>
        )}

        <ImageSelect
          name="main-photo"
          t={t}
          label={`${t("select-main-photo")} ${t("optional")}`}
          maxPhotoSize={maxPhotoSize}
        />

        <UserSelect
          initiallyAvailableUsers={[...project.members, ...users]}
          userFetcher={userFetcher}
          defaultValue={project.members}
          t={t}
          fetchMoreUsers={(filter: string) =>
            userFetcher.load(`?usersFilter=${filter}&ignoreTags=true`)
          }
        />

        <TagSelect
          initiallyAvailableTags={[
            ...project.tags.map(({ id, name }) => ({ id, name, priority: Infinity })),
            ...tags,
          ]}
          tagFetcher={tagFetcher}
          defaultValue={project.tags}
          t={t}
          fetchMoreTags={(filter: string) =>
            tagFetcher.load(`?tagsFilter=${filter}&ignoreUsers=true`)
          }
        />

        <label>
          {t("select-need-space")} <input type="checkbox" name="needProjectSpace" />
        </label>

        <button type="submit">{t("save")}</button>
      </Form>
    </main>
  );
}

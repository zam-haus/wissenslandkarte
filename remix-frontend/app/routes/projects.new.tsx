import type { ActionArgs, LoaderArgs, TypedResponse } from "@remix-run/node";
import {
  json,
  redirect,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";
import { Form, useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { ImageSelect } from "~/components/form-input/image-select";
import { TagSelect } from "~/components/form-input/tag-select";
import { UserSelect } from "~/components/form-input/user-select";
import { authenticator } from "~/lib/authentication.server";
import { createS3UploadHandler, MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/s3.server";
import { createProject } from "~/models/projects.server";
import { getTagList } from "~/models/tags.server";
import { getUserListFiltered } from "~/models/user.server";

import style from "./projects.new.module.css";

const FIELD_EMPTY = "FIELD_EMPTY";
const CREATE_FAILED = "CREATE_FAILED";

export const action = async ({
  request,
}: ActionArgs): Promise<TypedResponse<{ error: string; exception?: string }>> => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/" });

  const formData = await parseMultipartFormData(
    request,
    composeUploadHandlers(createS3UploadHandler(["main-photo"]), createMemoryUploadHandler())
  );
  const title = (formData.get("title") ?? "").toString().trim();
  const description = (formData.get("description") ?? "").toString().trim();
  const coworkers = formData.getAll("coworkers").map((value) => value.toString());
  const tags = formData.getAll("tags").map((value) => value.toString());
  const mainPhotoUrl = formData.get("main-photo");
  const needProjectSpace = Boolean(formData.get("needProjectSpace") ?? false);

  if (title.length === 0 || description.length === 0) {
    return json({
      error: FIELD_EMPTY,
    });
  }

  const urlFormDataToString = (url: FormDataEntryValue | null) =>
    url === null || typeof url !== "string" || url?.length === 0 ? undefined : url.toString();

  const mainPhoto = urlFormDataToString(mainPhotoUrl);

  try {
    const result = await createProject({
      title,
      description,
      mainPhoto,
      owners: [user.username],
      coworkers,
      tags,
      needProjectSpace,
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
  await authenticator.isAuthenticated(request, { failureRedirect: "/" });

  const params = new URL(request.url).searchParams;

  const usersFilter = params.get("usersFilter") ?? "";
  const tagsFilter = params.get("tagsFilter") ?? "";
  const ignoreUsers = Boolean(params.get("ignoreUsers") ?? false);
  const ignoreTags = Boolean(params.get("ignoreTags") ?? false);

  const [tags, users] = await Promise.all([
    ignoreTags ? Promise.resolve([]) : getTagList({ count: "projects", filter: tagsFilter }),
    ignoreUsers ? Promise.resolve([]) : getUserListFiltered(usersFilter),
  ]);

  return json({ tags, users, maxPhotoSize: MAX_UPLOAD_SIZE_IN_BYTE });
};

export const handle = {
  i18n: ["projects"],
};

export default function NewProject() {
  const currentPath = "/projects/new";
  const { tags, users, maxPhotoSize } = useLoaderData<typeof loader>();
  const { t } = useTranslation("projects");

  const tagFetcher = useFetcher<typeof loader>();
  const userFetcher = useFetcher<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <main>
      {actionData?.error === FIELD_EMPTY ? <div>{t("missing-name-or-description")}</div> : null}
      {actionData?.error === CREATE_FAILED ? (
        <div>
          {t("creation-failed")} {actionData?.exception}
        </div>
      ) : null}

      <Form
        method="post"
        action={currentPath}
        className={style.verticalForm}
        encType="multipart/form-data"
      >
        <label>
          {t("project-name")} {t("required")}
          <input name="title" type="text" required />
        </label>

        <label>
          {t("project-description")} {t("required")}
          <textarea name="description" required></textarea>
        </label>

        <ImageSelect
          name="main-photo"
          t={t}
          label={`${t("select-main-photo")} ${t("optional")}`}
          maxPhotoSize={maxPhotoSize}
        />

        <UserSelect
          initiallyAvailableUsers={users}
          userFetcher={userFetcher}
          t={t}
          fetchMoreUsers={(filter: string) =>
            userFetcher.load(`${currentPath}?usersFilter=${filter}&ignoreTags=true`)
          }
        />

        <TagSelect
          initiallyAvailableTags={tags}
          tagFetcher={tagFetcher}
          t={t}
          fetchMoreTags={(filter: string) =>
            tagFetcher.load(`${currentPath}?tagsFilter=${filter}&ignoreUsers=true`)
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

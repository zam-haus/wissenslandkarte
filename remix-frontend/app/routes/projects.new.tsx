import type { ActionArgs, LoaderArgs, TypedResponse } from "@remix-run/node";
import {
  json,
  redirect,
  unstable_composeUploadHandlers as composeUploadHandlers,
  unstable_createMemoryUploadHandler as createMemoryUploadHandler,
  unstable_parseMultipartFormData as parseMultipartFormData,
} from "@remix-run/node";
import { Form, useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { MultiSelect } from "~/components/multi-select/multi-select";
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

  const mainPhoto =
    mainPhotoUrl === null || typeof mainPhotoUrl !== "string" || mainPhotoUrl?.length === 0
      ? undefined
      : mainPhotoUrl.toString();

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

  const [availableTags, setAvailableTags] = useState(tags);
  const [availableUsers, setAvailableUsers] = useState(users);

  const [chosenTags, setChosenTags] = useState<string[]>([]);
  const [chosenUsers, setChosenUsers] = useState<string[]>([]);

  const tagFetcher = useFetcher<typeof loader>();
  const userFetcher = useFetcher<typeof loader>();
  const loadMoreTags = (filter: string) =>
    tagFetcher.load(`${currentPath}?tagsFilter=${filter}&ignoreUsers=true`);
  const loadMoreUsers = (filter: string) =>
    userFetcher.load(`${currentPath}?usersFilter=${filter}&ignoreTags=true`);

  const [mainPhotoTooLarge, setMainPhotoTooLarge] = useState(false);
  const resetSizeCheckWarning = () => setMainPhotoTooLarge(false);
  const sizeCheck = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    if (input.files !== null && [...input.files].some((file) => file.size > maxPhotoSize)) {
      setMainPhotoTooLarge(true);
      input.value = "";
    }
  };

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const newPhotoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    sizeCheck(event);

    const input = event.target;
    if (input.files !== null) {
      setPhotoPreviews([...input.files].map((file) => URL.createObjectURL(file)));
    }
  };

  useEffect(() => {
    setAvailableTags((availableTags) =>
      [...availableTags, ...(tagFetcher.data?.tags ?? [])].sort(
        (a, b) => (b._count.projects ?? 0) - (a._count.projects ?? 0)
      )
    );
  }, [tagFetcher.data]);
  useEffect(() => {
    setAvailableUsers((availableUsers) =>
      [...availableUsers, ...(userFetcher.data?.users ?? [])].sort((a, b) =>
        a.username.localeCompare(b.username)
      )
    );
  }, [userFetcher.data]);

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

        <label>
          {t("select-main-photo")} {t("required")}
          <input
            type="file"
            name="main-photo"
            accept="image/*"
            onClick={resetSizeCheckWarning}
            onChange={newPhotoSelected}
          />
          {mainPhotoTooLarge ? t("main-photo-too-large") : ""}
        </label>
        {photoPreviews.map((data) => (
          <img key={data} src={data} alt={t("main-photo-preview")} className={style.imagePreview} />
        ))}

        {userFetcher.state == "loading" ? "Loading..." : ""}
        <MultiSelect
          inputPlaceholder={t("typeahead-users")}
          inputLabel={`${t("select-other-users")} ${t("optional")}`}
          inputName="coworkers"
          chosenValues={chosenUsers}
          valuesToSuggest={availableUsers.map(({ username }) => username)}
          onFilterInput={(filterInput) => loadMoreUsers(filterInput)}
          onValueChosen={(newUser) => {
            setChosenUsers([...chosenUsers, newUser]);
          }}
          onValueRemoved={(removedUser) =>
            setChosenUsers(chosenUsers.filter((user) => user != removedUser))
          }
        ></MultiSelect>

        {tagFetcher.state == "loading" ? "Loading..." : ""}
        <MultiSelect
          inputPlaceholder={t("typeahead-tags")}
          inputLabel={`${t("select-tags")} ${t("optional")}`}
          inputName="tags"
          chosenValues={chosenTags}
          onFilterInput={(filterInput) => loadMoreTags(filterInput)}
          valuesToSuggest={availableTags.map(({ name }) => name)}
          allowAddingNew={true}
          onValueChosen={(newValue) => {
            setChosenTags([...chosenTags, newValue]);
          }}
          onValueRemoved={(removedValue) =>
            setChosenTags(chosenTags.filter((value) => value != removedValue))
          }
        ></MultiSelect>

        <label>
          {t("select-need-space")} <input type="checkbox" name="needProjectSpace" />
        </label>

        <button type="submit">{t("save")}</button>
      </Form>
    </main>
  );
}

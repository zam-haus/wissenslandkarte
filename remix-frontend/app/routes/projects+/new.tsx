import type { ActionArgs, LoaderArgs, TypedResponse } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { authenticator } from "~/lib/authentication.server";
import { upsertProjectToSearchIndex } from "~/lib/search.server";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/upload/handler-s3.server";
import { parseMultipartFormDataUploadFilesToS3 } from "~/lib/upload/pipeline.server";
import { createProject } from "~/models/projects.server";
import {
  loaderForTagFetcher,
  loaderForUserFetcher,
} from "~/routes/projects+/lib/loader-helpers.server";

import {
  getBooleanDefaultFalse,
  getStringArray,
  getStringsDefaultUndefined,
  getTrimmedStringsDefaultEmpty,
} from "../../lib/formDataParser";
import { ProjectForm } from "./components/project-form";

const FIELD_EMPTY = "FIELD_EMPTY";
const CREATE_FAILED = "CREATE_FAILED";

export const action = async ({
  request,
}: ActionArgs): Promise<TypedResponse<{ error: string; exception?: string }>> => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/" });

  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["mainPhoto"]);

  const { title, description } = getTrimmedStringsDefaultEmpty(formData, "title", "description");
  if (title.length === 0 || description.length === 0) {
    return json({
      error: FIELD_EMPTY,
    });
  }

  try {
    const result = await createProject({
      title,
      description,
      owners: [user.username],
      ...getStringArray(formData, "coworkers", "tags"),
      ...getStringsDefaultUndefined(formData, "mainPhoto"),
      ...getBooleanDefaultFalse(formData, "needProjectSpace"),
    });

    await upsertProjectToSearchIndex(result);

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

  return json({ tags: tagsByProject, users, maxPhotoSize: MAX_UPLOAD_SIZE_IN_BYTE });
};

export const handle = {
  i18n: ["projects"],
};

export default function NewProject() {
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

      <ProjectForm
        mode="create"
        action={undefined} // undefined means current url
        users={users}
        tags={tags}
        maxPhotoSize={maxPhotoSize}
        tagFetcher={tagFetcher}
        userFetcher={userFetcher}
      />
    </main>
  );
}

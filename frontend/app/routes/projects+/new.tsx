import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { createProject } from "~/database/repositories/projects.server";
import { getLoggedInUser, isAnyUserLoggedIn } from "~/lib/authorization.server";
import { upsertProjectToSearchIndex } from "~/lib/search.server";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/upload/constants";
import { parseMultipartFormDataUploadFilesToS3 } from "~/lib/upload/pipeline.server";
import {
  lowLevelTagLoader,
  lowLevelUserLoader,
} from "~/routes/global_loaders+/lib/loader-helpers.server";

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
}: ActionFunctionArgs): Promise<TypedResponse<never> | { error: string; exception?: string }> => {
  const user = await getLoggedInUser(request, { ifNotLoggedInRedirectTo: "/" });

  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["mainImage"]);

  const { title, description } = getTrimmedStringsDefaultEmpty(formData, "title", "description");
  if (title.length === 0 || description.length === 0) {
    return {
      error: FIELD_EMPTY,
    };
  }

  try {
    const result = await createProject({
      title,
      description,
      owners: [user.username],
      ...getStringArray(formData, "coworkers", "tags"),
      ...getStringsDefaultUndefined(formData, "mainImage"),
      ...getBooleanDefaultFalse(formData, "needProjectSpace"),
    });

    await upsertProjectToSearchIndex(result);

    return redirect(`/projects/${result.id}`);
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
  if (!(await isAnyUserLoggedIn(request))) {
    return redirect("/");
  }

  const searchParams = new URL(request.url).searchParams;
  const [{ tags }, { users }] = await Promise.all([
    lowLevelTagLoader(searchParams.get("tagFilter")),
    lowLevelUserLoader(searchParams.get("userFilter")),
  ]);

  return { tags, users };
};

export default function NewProject() {
  const { tags, users } = useLoaderData<typeof loader>();
  const { t } = useTranslation("projects");

  const actionData = useActionData<typeof action>();

  return (
    <main>
      {actionData?.error === FIELD_EMPTY ? <div>{t("missing-name-or-description")}</div> : null}
      {actionData?.error === CREATE_FAILED ? (
        <div>
          {t("creation-failed")} {actionData.exception}
        </div>
      ) : null}

      <ProjectForm
        mode="create"
        action={undefined} // undefined means current url
        users={users}
        tags={tags}
        maxImageSize={MAX_UPLOAD_SIZE_IN_BYTE}
      />
    </main>
  );
}

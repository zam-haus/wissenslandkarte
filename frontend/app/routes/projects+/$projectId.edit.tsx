import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import { getAllMetadataTypes } from "~/database/repositories/projectMetadata.server";
import { getProjectDetails, updateProject } from "~/database/repositories/projects.server";
import {
  getLoggedInUser,
  isAnyUserFromListLoggedIn,
  loggedInUserHasRole,
  Roles,
} from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";
import { logger } from "~/lib/logging.server";
import { upsertProjectToSearchIndex } from "~/lib/search/search.server";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/storage/constants";
import { deleteS3FilesByPublicUrl } from "~/lib/storage/s3Deletion.server";
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
import { getMetadataArray, validateMetadataArray } from "./lib/getMetadataArray.server";
import { storeProjectMainImageS3ObjectPurposes } from "./lib/storeS3ObjectPurpose.server";

const FIELD_EMPTY = "FIELD_EMPTY";
const UPDATE_FAILED = "UPDATE_FAILED";

// Only use in server functions!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const assertAuthorization = serverOnly$(
  async (
    request: Request,
    project: { id: string; owners: { id: string }[]; members: { id: string }[] },
  ) => {
    const isOwnerLoggedIn = await isAnyUserFromListLoggedIn(request, project.owners);
    const isMemberLoggedIn = await isAnyUserFromListLoggedIn(request, project.members);
    const isProjectAdminLoggedIn = await loggedInUserHasRole(request, Roles.ProjectEditor);

    if (!(isOwnerLoggedIn || isMemberLoggedIn || isProjectAdminLoggedIn)) {
      logger("project-edit").warn(
        `Someone tried editing project ${project.id} but was not authorized to do so`,
      );
      throw redirect("/");
    }
  },
)!;

export const action = async ({
  params,
  request,
}: ActionFunctionArgs): Promise<TypedResponse<never> | { error: string; exception?: string }> => {
  assertExistsOr400(params.projectId, `Missing project id`);

  const user = await getLoggedInUser(request, { ifNotLoggedInRedirectTo: "/" });

  const project = await getProjectDetails(params.projectId);
  assertExistsOr404(project, `Project not found: ${params.projectId}`);

  await assertAuthorization(request, project);

  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["mainImage"]);

  const { title, description } = getTrimmedStringsDefaultEmpty(formData, "title", "description");
  const { mainImage } = getStringsDefaultUndefined(formData, "mainImage");
  if (title.length === 0 || description.length === 0) {
    if (mainImage !== undefined) {
      await deleteS3FilesByPublicUrl([mainImage]);
    }
    return {
      error: FIELD_EMPTY,
    };
  }

  try {
    const { removeMainImage } = getBooleanDefaultFalse(formData, "removeMainImage");
    const metadata = getMetadataArray(formData);

    const validationResult = await validateMetadataArray(metadata);
    if (!validationResult.valid) {
      if (mainImage !== undefined) {
        await deleteS3FilesByPublicUrl([mainImage]);
      }
      return {
        error: UPDATE_FAILED,
        exception: "Metadata validation failed",
      };
    }

    if (mainImage !== undefined) {
      storeProjectMainImageS3ObjectPurposes(mainImage, project, logger("project-edit"));
    }

    if (project.mainImage !== null && (mainImage !== undefined || removeMainImage)) {
      await deleteS3FilesByPublicUrl([project.mainImage]);
    }

    const result = await updateProject(
      {
        id: params.projectId,
        title,
        description,
        owners: [user.username],
        ...getStringArray(formData, "coworkers", "tags"),
        mainImage,
        ...getBooleanDefaultFalse(formData, "needProjectSpace"),
        metadata,
      },
      { removeImageIfNoNewValueGiven: removeMainImage },
    );

    await upsertProjectToSearchIndex(result);

    return redirect(`/projects/${result.id}`);
  } catch (e: unknown) {
    if (!(e instanceof Error)) {
      return { error: UPDATE_FAILED };
    }
    return {
      error: UPDATE_FAILED,
      exception: e.message,
    };
  }
};

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.projectId, `Missing project id`);

  const project = await getProjectDetails(params.projectId);
  assertExistsOr404(project, `Project not found: ${params.projectId}`);

  await assertAuthorization(request, project);

  const searchParams = new URL(request.url).searchParams;
  const [{ tags }, { users }, availableMetadataTypes] = await Promise.all([
    lowLevelTagLoader(searchParams.get("tagFilter")),
    lowLevelUserLoader(searchParams.get("userFilter")),
    getAllMetadataTypes(),
  ]);

  return { tags, users, project, availableMetadataTypes };
};

export default function EditProject() {
  const { project, tags, users, availableMetadataTypes } = useLoaderData<typeof loader>();
  const { t } = useTranslation("projects");

  const actionData = useActionData<typeof action>();

  return (
    <main>
      {actionData?.error === FIELD_EMPTY ? <div>{t("missing-name-or-description")}</div> : null}
      {actionData?.error === UPDATE_FAILED ? (
        <div>
          {t("creation-failed")} {actionData.exception}
        </div>
      ) : null}
      <ProjectForm
        action={undefined} // undefined means current url
        mode="edit"
        users={users}
        tags={tags}
        maxImageSize={MAX_UPLOAD_SIZE_IN_BYTE}
        currentState={project}
        availableMetadataTypes={availableMetadataTypes}
        currentMetadata={project.metadata}
      />
    </main>
  );
}

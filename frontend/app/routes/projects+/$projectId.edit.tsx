import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import { Handle } from "types/handle";
import { ToastDuration, ToastType } from "~/components/toast/toast-context";
import { getAllMetadataTypes } from "~/database/repositories/projectMetadata.server";
import { getProjectDetails, updateProject } from "~/database/repositories/projects.server";
import i18next from "~/i18next.server";
import { isAnyUserFromListLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";
import { flashToastInSession } from "~/lib/flash-toast.server";
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

  const project = await getProjectDetails(params.projectId);
  assertExistsOr404(project, `Project not found: ${params.projectId}`);

  await assertAuthorization(request, project);

  const uploadFailed = "upload-failed";
  const formData = await parseMultipartFormDataUploadFilesToS3(
    request,
    ["mainImage"],
    uploadFailed,
  );

  const { title, description } = getTrimmedStringsDefaultEmpty(formData, "title", "description");
  let { mainImage } = getStringsDefaultUndefined(formData, "mainImage");
  let headers: Headers | undefined = undefined;
  if (mainImage === uploadFailed) {
    mainImage = undefined;
    const t = await i18next.getFixedT(request, "projects");
    headers = await flashToastInSession(
      request,
      t("project-create-edit.main-image-upload-failed"),
      ToastType.ERROR,
      ToastDuration.LONG,
    );
  }
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

    const { owner } = getStringsDefaultUndefined(formData, "owner");
    const canEditOwner = await loggedInUserHasRole(request, Roles.ProjectEditor);
    const owners = canEditOwner && owner ? [owner] : project.owners.map((u) => u.username);

    const result = await updateProject(
      {
        id: params.projectId,
        title,
        description,
        owners,
        ...getStringArray(formData, "coworkers", "tags"),
        mainImage,
        ...getBooleanDefaultFalse(formData, "needProjectSpace"),
        metadata,
      },
      { removeImageIfNoNewValueGiven: removeMainImage },
    );

    await upsertProjectToSearchIndex(result);

    return redirect(`/projects/${result.id}`, { headers });
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
  const [canEditOwner, { tags }, { users }, availableMetadataTypes] = await Promise.all([
    loggedInUserHasRole(request, Roles.ProjectEditor),
    lowLevelTagLoader(searchParams.get("tagFilter")),
    lowLevelUserLoader(searchParams.get("userFilter")),
    getAllMetadataTypes(),
  ]);

  return {
    tags,
    users,
    project,
    availableMetadataTypes,
    canEditOwner,
    defaultOwner: project.owners[0],
  };
};

export const handle: Handle<"projects"> = {
  pageTitleOverride: { ns: "projects", key: "titles.single-project-edit" },
};

export default function EditProject() {
  const { project, tags, users, availableMetadataTypes, canEditOwner, defaultOwner } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation("projects");

  const actionData = useActionData<typeof action>();

  return (
    <main>
      {actionData?.error === FIELD_EMPTY ? (
        <div>{t("project-create-edit.missing-description")}</div>
      ) : null}
      {actionData?.error === UPDATE_FAILED ? (
        <div>
          {t("project-create-edit.creation-failed")} {actionData.exception}
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
        canEditOwner={canEditOwner}
        defaultOwner={defaultOwner}
      />
    </main>
  );
}

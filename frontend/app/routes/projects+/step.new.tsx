import type { ActionFunctionArgs, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { serverOnly$ } from "vite-env-only/macros";

import { mapDeserializedDates } from "~/components/date-rendering";
import {
  getLoggedInUser,
  isAnyUserFromListLoggedIn,
  loggedInUserHasRole,
  Roles,
} from "~/lib/authorization.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import { upsertProjectStepToSearchIndex } from "~/lib/search.server";
import { MAX_UPLOAD_SIZE_IN_BYTE } from "~/lib/upload/constants";
import { parseMultipartFormDataUploadFilesToS3 } from "~/lib/upload/pipeline.server";
import { getProjectDetails, getProjectsByUser } from "~/models/projects.server";
import { createProjectStep } from "~/models/projectSteps.server";

import { getStringArray, getTrimmedStringsDefaultEmpty } from "../../lib/formDataParser";

import { StepForm } from "./components/step-form";

const FIELD_EMPTY = "FIELD_EMPTY";
const CREATE_FAILED = "CREATE_FAILED";

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
      console.warn(
        `Someone tried creating a new step for project ${project.id} but was not authorized to do so`,
      );
      throw redirect("/");
    }
  },
)!;

export const action = async ({
  request,
}: ActionFunctionArgs): Promise<TypedResponse<never> | { error: string; exception?: string }> => {
  const formData = await parseMultipartFormDataUploadFilesToS3(request, ["imageAttachments"]);

  const { projectId, description } = getTrimmedStringsDefaultEmpty(
    formData,
    "projectId",
    "description",
  );
  const { imageAttachments } = getStringArray(formData, "imageAttachments");

  if (description.length === 0) {
    return {
      error: FIELD_EMPTY,
    };
  }

  const project = await getProjectDetails(projectId);
  if (project === null) {
    return {
      error: CREATE_FAILED,
      exception: "No such project",
    };
  }

  await assertAuthorization(request, project);

  try {
    const result = await createProjectStep({
      description,
      projectId,
      imageAttachmentUrls: imageAttachments,
    });

    await upsertProjectStepToSearchIndex(result);

    return redirect(`/projects/${projectId}`);
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
  const user = await getLoggedInUser(request, { ifNotLoggedInRedirectTo: "/" });

  const projects = await getProjectsByUser(user.username);

  return { projects };
};

export const handle = {
  i18n: ["projects"],
};

export default function CreateStep() {
  const currentPath = "/projects/step/new";
  const { projects } = useLoaderData<typeof loader>();
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
          {t("creation-failed")} {actionData.exception}
        </div>
      ) : null}

      <StepForm
        action={currentPath}
        maxImageSize={MAX_UPLOAD_SIZE_IN_BYTE}
        projectsWithDates={projectsWithDates}
        mode="create"
      ></StepForm>
    </main>
  );
}

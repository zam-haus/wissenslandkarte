import type { ActionArgs, LoaderArgs, TypedResponse } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { mapDeserializedDates } from "~/components/date-rendering";
import { isAnyUserFromListLoggedIn } from "~/lib/authentication";
import { authenticator } from "~/lib/authentication.server";
import { descendingByDatePropertyComparator } from "~/lib/compare";
import {
  createProjectUpdate,
  getProjectDetails,
  getProjectsByUser,
} from "~/models/projects.server";

import style from "./projects.new.module.css";

const FIELD_EMPTY = "FIELD_EMPTY";
const CREATE_FAILED = "CREATE_FAILED";

export const action = async ({
  request,
}: ActionArgs): Promise<TypedResponse<{ error: string; exception?: string }>> => {
  const formData = await request.formData();
  const projectId = (formData.get("projectId") ?? "").toString().trim();
  const description = (formData.get("description") ?? "").toString().trim();

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
  const ownerLoggedIn = await isAnyUserFromListLoggedIn(request, project.owners);
  const memberLoggedIn = await isAnyUserFromListLoggedIn(request, project.members);
  if (!ownerLoggedIn && !memberLoggedIn) {
    return redirect("/");
  }

  try {
    const result = await createProjectUpdate({
      description,
      projectId,
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

  return json({ projects });
};

export const handle = {
  i18n: ["projects"],
};

export default function NewProject() {
  const currentPath = "/projects/new-update";
  const { projects } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation("projects");

  if (projects.length === 0) {
    return <main>t("no-projects");</main>;
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

      <Form method="post" action={currentPath} className={style.verticalForm}>
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

        <label>
          {t("update-text")}
          <textarea name="description" required></textarea>
        </label>

        <button type="submit">{t("save")}</button>
      </Form>
    </main>
  );
}

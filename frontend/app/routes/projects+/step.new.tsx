import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useTranslation } from "react-i18next";

import { getLatestProjectId } from "~/database/repositories/projects.server";
import { getLoggedInUser } from "~/lib/authorization.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getLoggedInUser(request, { ifNotLoggedInRedirectTo: "/" });

  const projectId = await getLatestProjectId(user.username);

  if (projectId !== null) {
    return redirect(`/projects/${projectId}/step/new`);
  }

  return {};
};

export default function CreateStep() {
  const { t } = useTranslation("projects");

  return <main>{t("no-projects")}</main>;
}

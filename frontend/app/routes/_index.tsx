import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Page } from "~/components/page/page";
import { ProjectsList } from "~/components/project-list/projects-list";
import { getProjectList } from "~/database/repositories/projects.server";
import { loaderLoginCheck } from "~/lib/authorization.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const projects = await getProjectList({
    byNewestModification: true,
    limit: 15,
  });

  return { projects, ...(await loaderLoginCheck(request)) };
};

export const handle = {
  i18n: ["landing-page", "users"],
};

export default function Index() {
  const { t } = useTranslation("landing-page");
  const { projects, isLoggedIn } = useLoaderData<typeof loader>();

  return (
    <Page isLoggedIn={isLoggedIn} title={t("main-headline")}>
      <p>{t("browse-prompt")}</p>

      <Link className="chip small" to="search/projects">
        {t("search-button")}
      </Link>

      <h2>{t("newest-steps-headline")}</h2>
      <ProjectsList projects={projects}></ProjectsList>
    </Page>
  );
}

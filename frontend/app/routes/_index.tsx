import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, NavLink, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Page } from "~/components/page/page";
import { ProjectsList } from "~/components/project-list/projects-list";
import { getProjectList } from "~/database/repositories/projects.server";
import { loaderLoginCheck, loggedInUserHasAdminRole } from "~/lib/authorization.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const projects = await getProjectList({
    byNewestModification: true,
    limit: 15,
  });

  const isAdmin = await loggedInUserHasAdminRole(request);

  return { projects, ...(await loaderLoginCheck(request)), isAdmin };
};

export const handle = {
  i18n: ["landing-page", "users"],
};

export default function Index() {
  const { t } = useTranslation("landing-page");
  const { projects, isLoggedIn, isAdmin } = useLoaderData<typeof loader>();

  const adminNavItems = (className?: string) =>
    isAdmin ? (
      <>
        <NavLink to="/admin/applicationInfo" className={className}>
          <i>info</i>
          Admin-Area
        </NavLink>
      </>
    ) : null;

  return (
    <Page isLoggedIn={isLoggedIn} title={t("main-headline")} additionalNavItems={adminNavItems}>
      <p>{t("browse-prompt")}</p>

      <Link className="chip small" to="search/projects">
        {t("search-button")}
      </Link>

      <h2>{t("newest-steps-headline")}</h2>
      <ProjectsList projects={projects}></ProjectsList>
    </Page>
  );
}

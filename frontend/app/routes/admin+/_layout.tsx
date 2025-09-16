import { LoaderFunctionArgs } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Page } from "~/components/page/page";
import { isAnyUserLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";

export { DefaultErrorBoundary as ErrorBoundary } from "~/components/default-error-boundary";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return {
    isLoggedIn: await isAnyUserLoggedIn(request),
    showInfrastructureRoutes: await loggedInUserHasRole(request, Roles.InfrastructureAdmin),
    showUserRoles: await loggedInUserHasRole(request, Roles.RoleManager),
  };
};

export const handle = {
  i18n: ["admin"],
};

export default function Admin() {
  const { t } = useTranslation("admin");
  const { isLoggedIn, showInfrastructureRoutes, showUserRoles } = useLoaderData<typeof loader>();

  return (
    <Page isLoggedIn={isLoggedIn} title={t("main-headline")}>
      <header className="secondary-container">
        <nav>
          {showInfrastructureRoutes ? (
            <>
              <NavLink to="/admin/applicationInfo" className="button secondary">
                <i>info</i>
                Admin: Application Info
              </NavLink>
              <NavLink to="/admin/s3Objects" className="button secondary">
                <i>cloud_upload</i>
                Admin: S3 Objects
              </NavLink>
              <NavLink to="/admin/searchIndex" className="button secondary">
                <i>search</i>
                Admin: Search Index
              </NavLink>
            </>
          ) : null}
          {showUserRoles ? (
            <NavLink to="/admin/user-roles" className="button secondary">
              <i>admin_panel_settings</i>
              Admin: User Roles
            </NavLink>
          ) : null}
        </nav>
      </header>
      <Outlet />
    </Page>
  );
}

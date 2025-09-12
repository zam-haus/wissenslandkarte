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

  const adminSpecialNav = (className?: string) =>
    (
      <>
        <div className="space"></div>
        {showInfrastructureRoutes ? (
          <>
            <NavLink to="/admin/applicationInfo" className={className}>
              <i>info</i>
              Admin: Application Info
            </NavLink>
            <NavLink to="/admin/s3Objects" className={className}>
              <i>cloud_upload</i>
              Admin: S3 Objects
            </NavLink>
            <NavLink to="/admin/searchIndex" className={className}>
              <i>search</i>
              Admin: Search Index
            </NavLink>
          </>
        ) : null}
        {showUserRoles ? (
          <NavLink to="/admin/user-roles" className={className}>
            <i>admin_panel_settings</i>
            Admin: User Roles
          </NavLink>
        ) : null}
      </>
    ) as React.ReactElement;

  return (
    <Page isLoggedIn={isLoggedIn} additionalNavItems={adminSpecialNav} title={t("main-headline")}>
      <Outlet />
    </Page>
  );
}

import { LoaderFunctionArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
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

  const adminSpecialNav = (
    <>
      {showInfrastructureRoutes ? (
        <>
          <li>
            <Link to="/admin/applicationInfo">Admin: Application Info</Link>
          </li>
          <li>
            <Link to="/admin/s3Objects">Admin: S3 Objects</Link>
          </li>
          <li>
            <Link to="/admin/searchIndex">Admin: Search Index</Link>
          </li>
        </>
      ) : null}
      {showUserRoles ? (
        <li>
          <Link to="/admin/user-roles">Admin: User Roles</Link>
        </li>
      ) : null}
    </>
  );

  return (
    <Page isLoggedIn={isLoggedIn} additionalNavItems={adminSpecialNav} title={t("main-headline")}>
      <Outlet />
    </Page>
  );
}

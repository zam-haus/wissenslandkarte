// Only use in server functions!

import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { serverOnly$ } from "vite-env-only/macros";

import { collectApplicationInfo } from "~/lib/applicationInfo.server";
import { loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { logger } from "~/lib/logging.server";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const assertAuthorization = serverOnly$(async (request: Request) => {
  const isInfrastructureAdminLoggedIn = await loggedInUserHasRole(
    request,
    Roles.InfrastructureAdmin,
  );

  const isRoleManagerLoggedIn = await loggedInUserHasRole(request, Roles.RoleManager);

  if (!isInfrastructureAdminLoggedIn && !isRoleManagerLoggedIn) {
    logger("admin-index").warn(`Someone tried accessing the admin panel without authorization`);
    throw redirect("/");
  }
})!;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await assertAuthorization(request);
  return { info: collectApplicationInfo() };
};

export default function EnvironmentInfo() {
  return <>Welcome, admin!</>;
}

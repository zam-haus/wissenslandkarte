import { LoaderFunctionArgs } from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";
import { serverOnly$ } from "vite-env-only/macros";

import { collectApplicationInfo } from "~/lib/applicationInfo.server";
import { loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { logger } from "~/lib/logging.server";

// Only use in server functions!
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const assertAuthorization = serverOnly$(async (request: Request) => {
  const isInfrastructureAdminLoggedIn = await loggedInUserHasRole(
    request,
    Roles.InfrastructureAdmin,
  );

  if (!isInfrastructureAdminLoggedIn) {
    logger("admin-environment").warn(
      `Someone tried accessing the environment information without authorization`,
    );
    throw redirect("/");
  }
})!;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await assertAuthorization(request);
  return { info: collectApplicationInfo() };
};

export default function EnvironmentInfo() {
  const { info } = useLoaderData<typeof loader>();
  return <pre>{JSON.stringify(info, null, 2)}</pre>;
}

import type { LoaderArgs } from "@remix-run/node";

import { authenticator, devKeycloakStrategyName } from "~/lib/authentication.server";

export const loader = async ({ request }: LoaderArgs) => {
  return authenticator.authenticate(devKeycloakStrategyName, request, {
    successRedirect: "/",
    failureRedirect: "/login/failed",
  });
};

import type { LoaderArgs } from "@remix-run/node";

import {
  authenticator,
  zamKeycloakStrategyName,
} from "~/lib/authentication.server";

export const loader = async ({ request }: LoaderArgs) => {
  return authenticator.authenticate(zamKeycloakStrategyName, request, {
    successRedirect: "/",
    failureRedirect: "/login/failed",
  });
};

import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { authenticator, devKeycloakStrategyName } from "~/lib/authentication.server";

export const loader = () => redirect("/login");

export const action = ({ request }: ActionArgs) => {
  return authenticator.authenticate(devKeycloakStrategyName, request, {
    successRedirect: "/",
    failureRedirect: "/login/failed",
  });
};

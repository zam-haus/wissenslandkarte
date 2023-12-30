import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import {
  authenticator,
  zamKeycloakStrategyName,
} from "~/lib/authentication.server";

export const loader = () => redirect("/login");

export const action = ({ request }: ActionArgs) => {
  return authenticator.authenticate(zamKeycloakStrategyName, request, {
    successRedirect: "/",
    failureRedirect: "/login/failed",
  });
};

import { User } from "@prisma/client";
import type { LoaderFunctionArgs } from "@remix-run/node";

import { tempUserSessionKey, userSessionKey } from "~/lib/session.server";

import { authenticate } from "./lib/authentication.server";
import { zamKeycloakStrategyName } from "./lib/strategiesSetup.server";

export const loader = ({ request }: LoaderFunctionArgs) => {
  return authenticate(zamKeycloakStrategyName, request, {
    successRedirect: (user: User) => (user.setupCompleted ? "/" : "/initial-profile-setup"),
    failureRedirect: "/login/failed",
    sessionKey: (user: User) => (user.setupCompleted ? userSessionKey : tempUserSessionKey),
  });
};

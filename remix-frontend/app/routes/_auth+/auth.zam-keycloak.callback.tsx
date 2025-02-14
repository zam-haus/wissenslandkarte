import type { User } from "@prisma/client";
import { type LoaderArgs } from "@remix-run/node";

import { zamKeycloakStrategyName } from "~/lib/authentication.server";

import { tempUserSessionKey } from "./initial-profile-setup";
import { authenticate, defaultSessionKey } from "./lib/handleKeycloakCallback.server";

export const loader = async ({ request }: LoaderArgs) => {
  return await authenticate(zamKeycloakStrategyName, request, {
    successRedirect: (user: User) => (user.setupCompleted ? "/" : "/initial-profile-setup"),
    sessionKey: (user: User) => (user.setupCompleted ? defaultSessionKey : tempUserSessionKey),
    failureRedirect: "/",
  });
};

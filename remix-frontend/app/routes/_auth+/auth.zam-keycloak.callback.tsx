import type { User } from "@prisma/client";
import { type LoaderArgs } from "@remix-run/node";

import { zamKeycloakStrategyName } from "~/lib/authentication.server";

import { authenticate } from "./lib/handleKeycloakCallback.server";

export const loader = async ({ request }: LoaderArgs) => {
  return await authenticate(zamKeycloakStrategyName, request, {
    successRedirect: (user: User) => (user.setupCompleted ? "/" : "/initial-profile-setup"),
    failureRedirect: "/",
  });
};

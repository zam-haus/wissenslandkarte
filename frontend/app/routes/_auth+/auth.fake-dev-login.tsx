import { User } from "@prisma/client";
import type { ActionFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { tempUserSessionKey, userSessionKey } from "~/lib/session.server";
import { fakeLoginOnDevStrategyName } from "~/routes/_auth+/lib/strategiesSetup.server";

import { authenticate } from "./lib/authentication.server";

export const loader = () => redirect("/login");

export const action = ({ request }: ActionFunctionArgs) => {
  return authenticate(fakeLoginOnDevStrategyName, request, {
    successRedirect: "/",
    failureRedirect: "/login/failed",
    sessionKey: (user: User) => (user.setupCompleted ? userSessionKey : tempUserSessionKey),
  });
};

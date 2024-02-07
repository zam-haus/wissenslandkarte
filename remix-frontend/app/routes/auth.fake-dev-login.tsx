import type { ActionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import { authenticator, fakeLoginOnDevStrategyName } from "~/lib/authentication.server";

export const loader = () => redirect("/login");

export const action = ({ request }: ActionArgs) => {
  return authenticator.authenticate(fakeLoginOnDevStrategyName, request, {
    successRedirect: "/",
    failureRedirect: "/login/failed",
  });
};

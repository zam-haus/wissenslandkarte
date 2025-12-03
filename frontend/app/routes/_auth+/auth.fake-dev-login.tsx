import { redirect } from "@remix-run/node";

import { authenticationLoaderFactory } from "./lib/authentication.server";
import { fakeLoginOnDevStrategyName } from "./lib/strategiesSetup.server";

export const loader = () => redirect("/login");

// This is technically an loader, but for this function it works as an action
export const action = authenticationLoaderFactory(fakeLoginOnDevStrategyName);

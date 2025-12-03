import { authenticationLoaderFactory } from "./lib/authentication.server";
import { devKeycloakStrategyName } from "./lib/strategiesSetup.server";

export const loader = authenticationLoaderFactory(devKeycloakStrategyName);

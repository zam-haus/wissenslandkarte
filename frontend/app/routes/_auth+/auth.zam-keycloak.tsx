import { authenticationLoaderFactory } from "./lib/authentication.server";
import { zamKeycloakStrategyName } from "./lib/strategiesSetup.server";

export const loader = authenticationLoaderFactory(zamKeycloakStrategyName);

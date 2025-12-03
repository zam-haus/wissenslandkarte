import type { LoaderFunction, LoaderFunctionArgs, TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import type { User } from "prisma/generated";
import { UserWithRoles } from "~/lib/authorization.server";
import { logger } from "~/lib/logging.server";
import type { SessionData } from "~/lib/session.server";
import { getSession, tempUserSessionKey, userSessionKey } from "~/lib/session.server";
import {
  authenticator,
  devKeycloakStrategyName,
  fakeLoginOnDevStrategyName,
  zamKeycloakStrategyName,
} from "~/routes/_auth+/lib/strategiesSetup.server";

export type DynamicAuthenticateOptions<T> = {
  successRedirect?: string | ((data: T) => string);
  failureRedirect?: string;
  sessionKey: keyof SessionData | ((data: T) => keyof SessionData);
};

export const authenticationLoaderFactory =
  (
    strategyName:
      | typeof zamKeycloakStrategyName
      | typeof devKeycloakStrategyName
      | typeof fakeLoginOnDevStrategyName,
  ): LoaderFunction =>
  ({ request }: LoaderFunctionArgs) => {
    return authenticate(strategyName, request, {
      successRedirect: (user: User) => {
        console.log("user.setupCompleted", user.setupCompleted);
        return user.setupCompleted ? "/" : "/initial-profile-setup";
      },
      failureRedirect: "/login/failed",
      sessionKey: (user: User) => (user.setupCompleted ? userSessionKey : tempUserSessionKey),
    });
  };

export async function authenticate(
  strategy: string,
  request: Request,
  options: DynamicAuthenticateOptions<User>,
): Promise<null | UserWithRoles | TypedResponse<never>> {
  let data: UserWithRoles;
  try {
    data = await authenticator.authenticate(strategy, request);
  } catch (e) {
    if (e instanceof Response) {
      throw e;
    }

    if (e instanceof Error) {
      logger("authentication").error("Error authenticating", { error: e.toString() });
    } else {
      logger("authentication").error("Error authenticating", { error: e });
    }

    if (options.failureRedirect === undefined) {
      return null;
    } else {
      return redirect(options.failureRedirect);
    }
  }
  const session = await getSession(request);
  const sessionKey = getSessionKey(options, data);
  session.set(sessionKey, data);

  const href = getSuccessRedirect(options, data);
  if (href === undefined) {
    return data;
  }

  const headers = await session.commit();
  return redirect(href, { headers });
}

function getSuccessRedirect(options: DynamicAuthenticateOptions<User>, data: User) {
  if (typeof options.successRedirect !== "function") {
    return options.successRedirect;
  }

  return options.successRedirect(data);
}

function getSessionKey(options: DynamicAuthenticateOptions<User>, data: User): keyof SessionData {
  if (typeof options.sessionKey == "string") {
    return options.sessionKey;
  }

  return options.sessionKey(data);
}

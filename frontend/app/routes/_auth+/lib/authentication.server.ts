import type { User } from "@prisma/client";
import type { TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";

import type { SessionData } from "~/lib/session.server";
import { getSession } from "~/lib/session.server";
import { authenticator } from "~/routes/_auth+/lib/strategiesSetup.server";

export type DynamicAuthenticateOptions<T> = {
  successRedirect?: string | ((data: T) => string);
  failureRedirect?: string;
  sessionKey: keyof SessionData | ((data: T) => keyof SessionData);
};

export async function authenticate(
  strategy: string,
  request: Request,
  options: DynamicAuthenticateOptions<User>,
): Promise<null | User | TypedResponse<never>> {
  let data: User;
  try {
    data = await authenticator.authenticate(strategy, request);
  } catch (e) {
    if (e instanceof Response) {
      throw e;
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

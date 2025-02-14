import type { User } from "@prisma/client";
import type { TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import type { AuthenticateOptions } from "remix-auth";

import { authenticator } from "~/lib/authentication.server";
import { getSession } from "~/lib/session";

export type DynamicAuthenticateOptions<T> = Partial<
  Omit<AuthenticateOptions, "successRedirect" | "sessionKey">
> & {
  successRedirect?: string | ((data: T) => string);
  sessionKey?: string | ((data: T) => string);
};

export const defaultSessionKey = "user";

/**
 * This is basically the same what authenticator.authenticate(strategy, request, {successRedirect: "/"}) does,
 * but we allow building the success redirect-string based on the user input
 *
 * TODO: This is over-engineered atm to fit in with the current authentication library version.
 * When we update the lib, we can simplify this function and put all the logic from passed-in
 * functions into this function.
 */
export async function authenticate(
  strategy: string,
  request: Request,
  options: DynamicAuthenticateOptions<User>
): Promise<null | User | TypedResponse<never>> {
  const optionsWithoutSuccessRedirect = { ...options, successRedirect: undefined };
  const data = await authenticator.authenticate(strategy, request, optionsWithoutSuccessRedirect);

  if (data === null) {
    if (options.failureRedirect === undefined) {
      return null;
    } else {
      return redirect(options.failureRedirect);
    }
  }

  const session = await getSession();
  const sessionKey = getSessionKey(options, data);
  session.set(sessionKey, data);
  const sessionData = await session.commit();

  const href = getSuccessRedirect(options, data);
  if (href === undefined) {
    return data;
  }

  const headers = new Headers({ "Set-Cookie": sessionData });
  return redirect(href, { headers });
}

function getSuccessRedirect(options: DynamicAuthenticateOptions<User>, data: User) {
  if (typeof options.successRedirect !== "function") {
    return options.successRedirect;
  }

  return options.successRedirect(data);
}

function getSessionKey(options: DynamicAuthenticateOptions<User>, data: User) {
  if (typeof options.sessionKey !== "function") {
    console.log("meh", options);
    return options.sessionKey || defaultSessionKey;
  }

  return options.sessionKey(data);
}

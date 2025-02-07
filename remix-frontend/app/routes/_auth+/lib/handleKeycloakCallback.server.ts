import type { User } from "@prisma/client";
import type { TypedResponse } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import type { AuthenticateOptions } from "remix-auth";

import { authenticator } from "~/lib/authentication.server";
import { getSession } from "~/lib/session";

export type DynamicAuthenticateOptions<T> = Partial<
  Omit<AuthenticateOptions, "successRedirect">
> & {
  successRedirect?: string | ((data: T) => string);
};

/**
 * This is basically the same what authenticator.authenticate(strategy, request, {successRedirect: "/"}) does,
 * but we allow building the success redirect-string based on the user input
 */
export async function authenticate(
  strategy: string,
  request: Request,
  options: DynamicAuthenticateOptions<User>
): Promise<never | User | TypedResponse<never>> {
  if (typeof options.successRedirect !== "function") {
    const successRedirect = options.successRedirect;
    return authenticator.authenticate(strategy, request, { ...options, successRedirect });
  }

  const optionsWithoutSuccessRedirect = { ...options, successRedirect: undefined };
  const data = await authenticator.authenticate(strategy, request, optionsWithoutSuccessRedirect);

  const session = await getSession();
  session.set(options.sessionKey || "user", data);
  const sessionData = await session.commit();

  const headers = new Headers({ "Set-Cookie": sessionData });
  const href = options.successRedirect(data);
  return redirect(href, { headers });
}

import type { CookieParseOptions, Session } from "@remix-run/node";
import { createCookieSessionStorage } from "@remix-run/node";

import { UserWithRoles } from "./authorization.server";
import { environment } from "./environment.server";

export const userSessionKey = "user";
export const tempUserSessionKey = "tempUser";
export const authErrorSessionKey = "auth:error";

export type SessionData = {
  [userSessionKey]?: UserWithRoles;
  [tempUserSessionKey]?: UserWithRoles;
};
export type FlashData = { [authErrorSessionKey]: DOMException };
type WlkSession = Session<SessionData, FlashData>;

export const sessionStorage =
  process.env.NODE_ENV === "development"
    ? createCookieSessionStorage()
    : createCookieSessionStorage({
        cookie: {
          name: "__session",
          secrets: [environment.SESSION_SECRET],
        },
      });

export async function getSession(
  request: Request,
  options?: CookieParseOptions,
): Promise<WlkSession & { commit: () => Promise<Headers> }> {
  const cookieHeader = request.headers.get("Cookie");
  const wrappedSession: WlkSession = await sessionStorage.getSession(cookieHeader, options);

  return {
    ...wrappedSession,
    /** Commits the session and returns the headers that set the new cookie */
    commit: async (): Promise<Headers> =>
      new Headers({ "Set-Cookie": await sessionStorage.commitSession(wrappedSession) }),
  };
}

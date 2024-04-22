import type { Session, SessionData } from "@remix-run/node";
import { createCookieSessionStorage } from "@remix-run/node";

import { environment } from "./environment";

type WrappedType = Session<SessionData, SessionData>;
type ArgOf<P extends keyof WrappedType> = WrappedType[P] extends (...args: any) => any
  ? Parameters<WrappedType[P]>
  : never;
type ReturnOf<P extends keyof WrappedType> = WrappedType[P] extends (...args: any) => any
  ? ReturnType<WrappedType[P]>
  : never;

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
  ...args: Parameters<typeof sessionStorage.getSession>
): Promise<WrappedType & { getAndCommit: ReturnOf<"get"> }> {
  const wrappedSession: WrappedType = await sessionStorage.getSession(...args);

  return {
    id: wrappedSession.id,
    data: wrappedSession.data,
    has: (name: string) => wrappedSession.has(name),
    /** If you get something that may have been `flash`ed, use `getAndCommit`! */
    get: (...args: ArgOf<"get">): ReturnOf<"get"> => wrappedSession.get(...args),
    getAndCommit: async (...args: ArgOf<"get">): Promise<ReturnOf<"get">> => {
      const got = wrappedSession.get(...args);
      await sessionStorage.commitSession(wrappedSession);
      return got;
    },
    set: (...args: ArgOf<"set">): ReturnOf<"set"> => wrappedSession.set(...args),
    flash: (...args: ArgOf<"flash">): ReturnOf<"flash"> => wrappedSession.flash(...args),
    unset: (...args: ArgOf<"unset">): ReturnOf<"unset"> => wrappedSession.unset(...args),
  };
}

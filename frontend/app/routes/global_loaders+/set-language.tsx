import type { ActionFunction } from "@remix-run/node";
import { data, createCookie } from "@remix-run/node";

import i18nConfig from "~/i18n";

export const localeCookie = createCookie("locale", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 365 * 24 * 60 * 60,
  sameSite: "lax",
});

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const lng = formData.get("lng");

  if (typeof lng !== "string") {
    return data({ success: false });
  }

  const supportedLanguages = i18nConfig.supportedLngs;
  if (!supportedLanguages.includes(lng)) {
    return data({ success: false });
  }

  const cookieHeader = await localeCookie.serialize(lng);
  return data(
    { success: true },
    {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    },
  );
};

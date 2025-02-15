import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { authErrorSessionKey, getSession } from "~/lib/session";

export const loader = async ({ request }: LoaderArgs) => {
  const session = await getSession(request);
  const error = session.get(authErrorSessionKey);

  const headers = await session.commit();

  return json({ error }, { headers });
};

export const handles = {
  i18n: ["login"],
};

export default function LoginFailed() {
  const { error } = useLoaderData<typeof loader>();
  const { t } = useTranslation("login");

  return (
    <>
      <h2>{t("login-failed")}</h2>
      <p>
        {t("unexpected-error")} {error?.message}
      </p>
    </>
  );
}

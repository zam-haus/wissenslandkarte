import type { LoaderFunctionArgs } from "@remix-run/node";
import { data, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { authErrorSessionKey, getSession } from "~/lib/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request);
  const error = session.get(authErrorSessionKey);

  const headers = await session.commit();

  return data({ error }, { headers });
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

import { Outlet, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Page } from "~/components/page/page";
import { isLoggedInLoader } from "~/lib/authorization.server";

export { DefaultErrorBoundary as ErrorBoundary } from "~/components/default-error-boundary";

export const loader = isLoggedInLoader;

export const handle = {
  i18n: ["users"],
};

export default function Search() {
  const { t } = useTranslation("users");
  const { isLoggedIn } = useLoaderData<typeof loader>();

  return (
    <Page isLoggedIn={isLoggedIn} title={t("main-headline")}>
      <Outlet />
    </Page>
  );
}

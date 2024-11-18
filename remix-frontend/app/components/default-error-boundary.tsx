import { isRouteErrorResponse, useLoaderData, useRouteError } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { isLoggedInLoader } from "~/lib/authentication";

import { Page } from "./page/page";

export const loader = isLoggedInLoader;

export function DefaultErrorBoundary() {
  const { t } = useTranslation("common");
  const error = useRouteError();
  const { isLoggedIn } = useLoaderData<typeof loader>();

  if (isRouteErrorResponse(error)) {
    return (
      <Page isLoggedIn={isLoggedIn} title={t("error-header")}>
        <h2>
          `${error.status} ${error.statusText}`
        </h2>
        <p>{error.data}</p>
      </Page>
    );
  } else if (error instanceof Error) {
    return (
      <Page isLoggedIn={isLoggedIn} title={t("exception-header")}>
        <h2>{error.message}</h2>
        <p>{t("exception-explanation")}</p>
        <pre>{error.stack}</pre>
      </Page>
    );
  } else {
    return (
      <Page isLoggedIn={isLoggedIn} title={t("unknown-error-header")}>
        <p>{t("unknown-error-explanation")}</p>
      </Page>
    );
  }
}

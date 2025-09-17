import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Page } from "./page/page";

export function DefaultErrorBoundary() {
  const { t } = useTranslation("common");
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <Page isLoggedIn={false} fallbackTitle={t("error-header")}>
        <h2>{error.status}</h2>
        <p>{error.statusText}</p>
      </Page>
    );
  } else if (error instanceof Error) {
    return (
      <Page isLoggedIn={false} fallbackTitle={t("exception-header")}>
        <h2>{error.message}</h2>
        <p>{t("exception-explanation")}</p>
        <pre>{error.stack}</pre>
      </Page>
    );
  } else {
    return (
      <Page isLoggedIn={false} fallbackTitle={t("unknown-error-header")}>
        <p>{t("unknown-error-explanation")}</p>
      </Page>
    );
  }
}

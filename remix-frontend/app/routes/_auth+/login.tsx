import type { LoaderFunction } from "@remix-run/node";
import { Form, Outlet } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Page } from "~/components/page/page";
import { authenticator } from "~/lib/authentication.server";

export const handles = {
  i18n: ["login"],
};

export const loader: LoaderFunction = async ({ request }) => {
  await authenticator.isAuthenticated(request, { successRedirect: "/" });
  return null;
};

export default function Login() {
  const { t } = useTranslation("login");
  if (process.env.NODE_ENV === "development") {
    return (
      <Page isLoggedIn={false} title={t("main-headline")}>
        <Form action="/auth/fake-dev-login" method="post">
          <input type="password" name="password" />
          <button type="submit">Do the fake login (if enabled)</button>
          <Outlet></Outlet>
        </Form>

        <Form action="/auth/dev-keycloak" method="post">
          <button>Or login using dev-keycloak (must be running, obviously)</button>
          <Outlet></Outlet>
        </Form>
      </Page>
    );
  }

  return (
    <Page isLoggedIn={false} title={t("main-headline")}>
      <Form action="/auth/zam-keycloak" method="post">
        <button>{t("use-zam-sso")}</button>
        <Outlet></Outlet>
      </Form>
    </Page>
  );
}

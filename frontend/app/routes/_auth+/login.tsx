import type { LoaderFunction } from "@remix-run/node";
import { Form, Link, Outlet, redirect } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Page } from "~/components/page/page";
import { isAnyUserLoggedIn } from "~/lib/authorization.server";

export const handles = {
  i18n: ["login"],
};

export const loader: LoaderFunction = async ({ request }) => {
  if (await isAnyUserLoggedIn(request)) {
    return redirect("/");
  }
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

        <Link to="/auth/dev-keycloak">
          Or login using dev-keycloak (must be running, obviously)
        </Link>
        <Outlet></Outlet>
      </Page>
    );
  }

  return (
    <Page isLoggedIn={false} title={t("main-headline")}>
      <Link to="/auth/zam-keycloak">{t("use-zam-sso")}</Link>
      <Outlet></Outlet>
    </Page>
  );
}

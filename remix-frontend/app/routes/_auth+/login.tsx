import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Outlet, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Page } from "~/components/page/page";
import { authenticator } from "~/lib/authentication.server";
import { environment } from "~/lib/environment";

export const handles = {
  i18n: ["login"],
};

export const loader: LoaderFunction = async ({ request }) => {
  await authenticator.isAuthenticated(request, { successRedirect: "/" });
  const fakeLoginEnabled = environment.auth.DANGER_ENABLE_FAKE_LOGIN_ON_DEV;

  return json({ fakeLoginEnabled });
};

export default function Login() {
  const { t } = useTranslation("login");
  const { fakeLoginEnabled } = useLoaderData<typeof loader>();

  if (fakeLoginEnabled) {
    return (
      <Page isLoggedIn={false} title={t("main-headline")}>
        <Form action="/auth/fake-dev-login" method="post">
          <input type="password" name="password" />
          <button type="submit">Do the fake login</button>
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

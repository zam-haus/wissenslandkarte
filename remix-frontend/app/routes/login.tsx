import { json } from "@remix-run/node";
import { Form, Outlet, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Page } from "~/components/page/page";

export const handles = {
  i18n: ["login"],
};

export async function loader() {
  const fakeLoginEnabled =
    process.env["DANGER_ENABLE_FAKE_LOGIN_ON_DEV"] === "true" &&
    process.env.NODE_ENV === "development";

  return json({ fakeLoginEnabled });
}

export default function Login() {
  const { t } = useTranslation("login");
  const { fakeLoginEnabled } = useLoaderData<typeof loader>();

  if (fakeLoginEnabled) {
    return (
      <Page title={t("main-headline")}>
        <Form action="/auth/fake-dev-login" method="post">
          <input type="password" name="password" />
          <button type="submit">Do the fake login</button>
          <Outlet></Outlet>
        </Form>
      </Page>
    );
  }

  return (
    <Page title={t("main-headline")}>
      <Form action="/auth/zam-keycloak" method="post">
        <button>{t("use-zam-sso")}</button>
        <Outlet></Outlet>
      </Form>
    </Page>
  );
}

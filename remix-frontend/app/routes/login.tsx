import { Form, Outlet } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Page } from "~/components/page/page";

export const handles = {
  i18n: ["login"],
};

export default function Login() {
  const { t } = useTranslation("login");

  return (
    <Page title={t("main-headline")}>
      <Form action="/auth/zam-keycloak" method="post">
        <button>{t("use-zam-sso")}</button>
        <Outlet></Outlet>
      </Form>
    </Page>
  );
}

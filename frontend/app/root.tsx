import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import beercss from "beercss/dist/cdn/beer.min.css?url";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next/react";

import i18next from "~/i18next.server";

import styles from "./root.module.css";

export const links: LinksFunction = () => [
  {
    rel: "icon",
    href: "/favicon-128.png",
    type: "image/png",
  },
  { rel: "stylesheet", href: beercss },
];

export const meta: MetaFunction = () => [{ title: "Wissenslandkarte" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await i18next.getLocale(request);
  return { locale };
}

export const handle = {
  i18n: ["common"],
};

export default function App() {
  const { locale } = useLoaderData<typeof loader>();

  const { i18n } = useTranslation();

  useChangeLanguage(locale);

  return (
    <html lang={locale} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className={styles.body}>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

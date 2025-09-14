import {
  data,
  type LinksFunction,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import beercss from "beercss/dist/cdn/beer.min.css?url";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next/react";

import { ToastContainer } from "~/components/toast/toast-container";
import { ToastProvider } from "~/components/toast/toast-context";
import globalStyles from "~/global.css?url";
import i18next from "~/i18next.server";

import { loadToastsFromSession } from "./lib/flash-toast.server";

export const links: LinksFunction = () => [
  {
    rel: "icon",
    href: "/favicon-128.png",
    type: "image/png",
  },
  { rel: "stylesheet", href: beercss },
  { rel: "stylesheet", href: globalStyles },
];

export const meta: MetaFunction = () => [{ title: "Wissenslandkarte" }];

export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await i18next.getLocale(request);
  const toastsFromSession = await loadToastsFromSession(request);
  if (toastsFromSession === null) {
    return { locale };
  }
  const { toastData, headers } = toastsFromSession;
  return data({ locale, ...toastData }, { headers });
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
      <body>
        <ToastProvider>
          <Outlet />
          <ToastContainer />
        </ToastProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

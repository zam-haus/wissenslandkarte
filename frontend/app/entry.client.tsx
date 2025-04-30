import { RemixBrowser } from "@remix-run/react";
import i18next from "i18next";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import Fetch from "i18next-fetch-backend";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { getInitialNamespaces } from "remix-i18next/client";

import i18nConfig from "./i18n";

async function hydrate() {
  // eslint-disable-next-line import/no-named-as-default-member
  await i18next
    .use(initReactI18next)
    .use(Fetch) // Tell i18next to use the Fetch backend
    .use(I18nextBrowserLanguageDetector) // Setup a client-side language detector
    .init({
      ...i18nConfig,
      ns: getInitialNamespaces(),
      backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
      detection: {
        // Here only enable htmlTag detection, we'll detect the language only
        // server-side with remix-i18next, by using the `<html lang>` attribute
        // we can communicate to the client the language detected server-side
        order: ["htmlTag"],
        // Because we only use htmlTag, there's no reason to cache the language
        // on the browser, so we disable it
        caches: [],
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <RemixBrowser />
        </StrictMode>
      </I18nextProvider>,
    );
  });
}

// Safari doesn't support requestIdleCallback
// https://caniuse.com/requestidlecallback
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (window.requestIdleCallback) {
  window.requestIdleCallback(
    () =>
      void hydrate()
        .then(() => void 0)
        .catch((e: unknown) => console.error("hydration failed", e)),
  );
} else {
  window.setTimeout(
    () =>
      void hydrate()
        .then(() => void 0)
        .catch((e: unknown) => console.error("hydration failed", e)),
    1,
  );
}

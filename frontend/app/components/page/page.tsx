import { Link, NavLink, UIMatch, useFetcher, useMatches } from "@remix-run/react";
import { ParseKeys } from "i18next";
import React, { type PropsWithChildren, PropsWithRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { OverrideHandle } from "types/handle";
import { Namespaces } from "types/i18n-namespaces";
import { ToastDuration, useToast } from "~/components/toast/toast-context";

import { ActionBar } from "./action-bar";
import styles from "./page.module.css";

type GlobalButtonConfig<NS extends Namespaces = Namespaces> = {
  relativeRoute: string;
  icon: string;
  i18nLabelKey: ParseKeys<NS>;
  i18nLabelNamespace: NS;
};

type GlobalButton = GlobalButtonConfig<Namespaces> & {
  route: string;
};

export function conditionalShowGlobalButtons(buttons: {
  editButton?: boolean;
  deleteButton?: boolean;
  moreButtons?: GlobalButtonConfig<Namespaces>[];
}): { globalButtons: GlobalButtonConfig<Namespaces>[] } {
  const editButton = {
    relativeRoute: "edit",
    i18nLabelKey: "toplevel-edit" as const,
    i18nLabelNamespace: "common" as const,
    icon: "edit",
  };
  const deleteButton = {
    relativeRoute: "delete",
    i18nLabelKey: "toplevel-delete" as const,
    i18nLabelNamespace: "common" as const,
    icon: "delete",
  };
  return {
    globalButtons: [
      ...(buttons.editButton ? [editButton] : []),
      ...(buttons.deleteButton ? [deleteButton] : []),
      ...(buttons.moreButtons ?? []),
    ],
  };
}

function getGlobalButtonRequests(routes: UIMatch[]): GlobalButton[] {
  return routes.flatMap((route) => {
    if (typeof route.data === "object" && route.data !== null && "globalButtons" in route.data) {
      return (route.data.globalButtons as GlobalButtonConfig<Namespaces>[]).map((button) => ({
        ...button,
        route: route.pathname + "/" + button.relativeRoute,
      }));
    }
    return [];
  });
}

function useGetRouteTitle(routes: UIMatch[]): string | null {
  const { t } = useTranslation();

  // Look for title in route data first (most specific)
  for (const route of routes) {
    if (
      typeof route.data === "object" &&
      route.data !== null &&
      "pageTitleOverride" in route.data &&
      typeof route.data.pageTitleOverride === "string"
    ) {
      return route.data.pageTitleOverride;
    }
  }

  const isOverrideHandle = (handle: unknown): handle is OverrideHandle =>
    typeof handle === "object" &&
    handle !== null &&
    "pageTitleOverride" in handle &&
    handle.pageTitleOverride !== null &&
    typeof handle.pageTitleOverride === "object" &&
    "key" in handle.pageTitleOverride &&
    typeof handle.pageTitleOverride.key === "string" &&
    "ns" in handle.pageTitleOverride &&
    typeof handle.pageTitleOverride.ns === "string";

  // Then look for pageTitleOverride in route handle (less specific)
  for (const route of routes) {
    if (isOverrideHandle(route.handle)) {
      const { key, ns } = route.handle.pageTitleOverride;

      return t(key, { ns });
    }
  }

  return null;
}

export function Page({
  fallbackTitle,
  isLoggedIn,
  children,
  additionalNavItems,
}: PropsWithChildren<{
  fallbackTitle: string;
  isLoggedIn: boolean;
  additionalNavItems?: (className?: string) => React.ReactElement | null;
}>) {
  const [menuOpen, setMenuOpen] = useState(false);

  const matches = useMatches();
  const globalButtonRequests = getGlobalButtonRequests(matches);
  const routeTitle = useGetRouteTitle(matches);
  const title = routeTitle ?? fallbackTitle;

  if (
    !matches.some(
      (route) =>
        typeof route.handle === "object" &&
        route.handle != null &&
        "i18n" in route.handle &&
        Array.isArray(route.handle.i18n) &&
        route.handle.i18n.includes("common"),
    )
  ) {
    throw Error("Route does not include 'common' i18n resources in its handle export.");
  }

  return (
    <>
      <dialog className={"s left " + styles.drawer + " " + (menuOpen ? "active " : "")}>
        <header className={styles.drawerHeader}>
          <button className="transparent circle" onClick={() => setMenuOpen(false)}>
            <i>arrow_back</i>
          </button>

          <nav>
            <img className="circle large" src="/favicon-128.png" />
          </nav>
        </header>
        <div className="space"></div>

        <nav className={`left row ${styles.drawerNav}`}>
          <NavItems
            isLoggedIn={isLoggedIn}
            additionalNavItems={additionalNavItems}
            itemClassName="button small-round transparent"
          />
          <div className="space"></div>
          <LanguageChooser className="small-round transparent" />
        </nav>
      </dialog>
      <header className={"fill " + styles.globalHeader}>
        <nav>
          <img src="/favicon-128.png" className={`m l round ${styles.logo}`} />
          <button onClick={() => setMenuOpen(!menuOpen)} className="s circle transparent">
            <i>menu</i>
          </button>

          <h1 className={`max center-align ${styles.title}`}>{title}</h1>

          <GlobalButtons globalButtonRequests={globalButtonRequests} />
        </nav>
      </header>

      <div id="globalScrollContainer" className={styles.scrollContainer}>
        <nav className={`m l left ${styles.stickyNav}`}>
          <NavItems isLoggedIn={isLoggedIn} additionalNavItems={additionalNavItems} />

          <div className="space"></div>
          <LanguageChooser className="vertical" />
        </nav>
        <main className="no-padding">{children}</main>
      </div>
      <footer className={"no-padding " + styles.globalFooter}>
        {isLoggedIn ? <ActionBar /> : <></>}
      </footer>
    </>
  );
}

function NavItems({
  isLoggedIn,
  additionalNavItems,
  itemClassName,
}: PropsWithRef<{
  isLoggedIn: boolean;
  additionalNavItems?: (className?: string) => React.ReactElement | null;
  itemClassName?: string;
}>) {
  const { t } = useTranslation("common");

  const loginSection = isLoggedIn ? (
    <>
      <NavLink to="/users/me" className={itemClassName}>
        <i>account_box</i>
        {t("nav-profile")}
      </NavLink>
      <NavLink to="/logout" className={itemClassName}>
        <i>logout</i>
        {t("nav-logout")}
      </NavLink>
    </>
  ) : (
    <>
      <NavLink to="/login" className={itemClassName}>
        <i>login</i>
        {t("nav-login")}
      </NavLink>
    </>
  );

  return (
    <>
      <NavLink to="/" className={itemClassName}>
        <i>home</i>
        {t("nav-landing-page")}
      </NavLink>
      <NavLink to="/search" className={itemClassName}>
        <i>search</i>
        {t("nav-search")}
      </NavLink>
      <NavLink to="/projects" className={itemClassName}>
        <i>handyman</i>
        {t("nav-projects")}
      </NavLink>
      <NavLink to="/users" className={itemClassName}>
        <i>group</i>
        {t("nav-people")}
      </NavLink>
      <NavLink to="/faq" className={itemClassName}>
        <i>help</i>
        {t("nav-faq")}
      </NavLink>
      {additionalNavItems?.(itemClassName)}
      <div className="space"></div>
      {loginSection}
    </>
  );
}

function GlobalButtons({ globalButtonRequests }: { globalButtonRequests: GlobalButton[] }) {
  const { t } = useTranslation("common");
  const buttonCount = globalButtonRequests.length;

  if (buttonCount === 0) {
    return null;
  }

  const firstButton = globalButtonRequests[0];
  return (
    <>
      <button className="s transparent square">
        <i>more_vert</i>
        <menu className="border no-wrap left">
          {globalButtonRequests.map((button) => (
            <li key={button.route}>
              <Link to={button.route}>
                <i>{button.icon}</i>
                <span>{t(button.i18nLabelKey, { ns: button.i18nLabelNamespace })}</span>
              </Link>
            </li>
          ))}
        </menu>
      </button>
      <div className={`group split m l ${styles.globalButtonContainer}`}>
        <Link
          className={`button  secondary border ${buttonCount > 1 ? "left-round no-margin" : ""}`}
          to={firstButton.route}
        >
          <i>{firstButton.icon}</i>
          <span>{t(firstButton.i18nLabelKey, { ns: firstButton.i18nLabelNamespace })}</span>
        </Link>

        {buttonCount > 1 ? (
          <div className={`min ${styles.globalButtonMenu}`}>
            <button className="right-round square secondary no-margin">
              <i>keyboard_arrow_down</i>
            </button>

            <menu className="bottom transparent no-wrap left right-align">
              {globalButtonRequests.slice(1).map((button) => (
                <Link key={button.route} to={button.route}>
                  <button className="secondary border small-round">
                    <i>{button.icon}</i>
                    <span>{t(button.i18nLabelKey, { ns: button.i18nLabelNamespace })}</span>
                  </button>
                </Link>
              ))}
            </menu>
          </div>
        ) : null}
      </div>
    </>
  );
}

function LanguageChooser({ className }: { className?: string }) {
  const { t, i18n } = useTranslation("common");
  const fetcher = useFetcher();
  const { showToast } = useToast();

  const supportedLanguages = [
    { code: "en", label: t("language-english"), icon: "🇬🇧" },
    { code: "de", label: t("language-german"), icon: "🇩🇪" },
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n
      .changeLanguage(languageCode)
      .then(() => {
        fetcher.submit(
          { lng: languageCode },
          { method: "post", action: "/global_loaders/set-language" },
        );
      })
      .catch((error: unknown) => {
        showToast(t("language-change-error"), { type: "error", duration: ToastDuration.LONG });
        console.error(error);
      });
  };

  return (
    <>
      <button className={`button small-round transparent ${className ?? ""}`}>
        <i>language</i>
        <span>{t("language")}</span>
        <menu className="top border no-wrap">
          {supportedLanguages.map((lang) => (
            <li
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={lang.code === i18n.language ? "active" : ""}
            >
              <i>{lang.icon}</i>
              {lang.label}
            </li>
          ))}
        </menu>
      </button>
    </>
  );
}

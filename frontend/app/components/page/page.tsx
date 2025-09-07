import { Link, UIMatch, useFetcher, useMatches } from "@remix-run/react";
import { ParseKeys } from "i18next";
import React, { type PropsWithChildren, PropsWithRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ActionBar } from "./action-bar";
import styles from "./page.module.css";

type GlobalButtonConfig = {
  relativeRoute: string;
  icon: string;
  i18nLabelKey: ParseKeys<"common">;
};

type GlobalButton = GlobalButtonConfig & {
  route: string;
};

export function conditionalShowGlobalButtons(buttons: {
  editButton?: boolean;
  deleteButton?: boolean;
}): { globalButtons: GlobalButtonConfig[] } {
  const editButton = {
    relativeRoute: "edit",
    i18nLabelKey: "toplevel-edit" as const,
    icon: "edit",
  };
  const deleteButton = {
    relativeRoute: "delete",
    i18nLabelKey: "toplevel-delete" as const,
    icon: "delete",
  };
  return {
    globalButtons: [
      ...(buttons.editButton ? [editButton] : []),
      ...(buttons.deleteButton ? [deleteButton] : []),
    ],
  };
}

function getGlobalButtonRequests(routes: UIMatch[]): GlobalButton[] {
  return routes.flatMap((route) => {
    if (typeof route.data === "object" && route.data !== null && "globalButtons" in route.data) {
      return (route.data.globalButtons as GlobalButtonConfig[]).map((button) => ({
        ...button,
        route: route.pathname + "/" + button.relativeRoute,
      }));
    }
    return [];
  });
}

export function Page({
  title,
  isLoggedIn,
  children,
  additionalNavItems,
}: PropsWithChildren<{
  title: string;
  isLoggedIn: boolean;
  additionalNavItems?: React.JSX.Element;
}>) {
  const [menuOpen, setMenuOpen] = useState(false);

  const matches = useMatches();
  const globalButtonRequests = getGlobalButtonRequests(matches);

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
  additionalNavItems?: React.JSX.Element;
  itemClassName?: string;
}>) {
  const { t } = useTranslation("common");

  const loginSection = isLoggedIn ? (
    <>
      <Link to="/users/me" className={itemClassName}>
        <i>account_box</i>
        {t("nav-profile")}
      </Link>
      <Link to="/logout" className={itemClassName}>
        <i>logout</i>
        {t("nav-logout")}
      </Link>
    </>
  ) : (
    <>
      <Link to="/login" className={itemClassName}>
        <i>login</i>
        {t("nav-login")}
      </Link>
    </>
  );

  return (
    <>
      <Link to="/" className={itemClassName}>
        <i>home</i>
        {t("nav-landing-page")}
      </Link>
      <Link to="/search" className={itemClassName}>
        <i>search</i>
        {t("nav-search")}
      </Link>
      <Link to="/projects" className={itemClassName}>
        <i>handyman</i>
        {t("nav-projects")}
      </Link>
      <Link to="/users" className={itemClassName}>
        <i>group</i>
        {t("nav-people")}
      </Link>
      <Link to="/" className={itemClassName}>
        <i>help</i>
        {t("nav-faq")}
      </Link>
      {additionalNavItems}
      <div className="space"></div>
      {loginSection}
    </>
  );
}

function GlobalButtons({ globalButtonRequests }: { globalButtonRequests: GlobalButton[] }) {
  const { t } = useTranslation("common");

  if (globalButtonRequests.length === 0) {
    return null;
  }

  return (
    <>
      <button className="s m transparent square">
        <i>more_vert</i>
        <menu className="border no-wrap left">
          {globalButtonRequests.map((button) => (
            <li key={button.route}>
              <Link to={button.route}>
                <i>{button.icon}</i>
                <span>{t(button.i18nLabelKey)}</span>
              </Link>
            </li>
          ))}
        </menu>
      </button>
      {globalButtonRequests.map((button) => (
        <Link className="l" key={button.route + button.i18nLabelKey} to={button.route}>
          <button className="border small-round">
            <i>{button.icon}</i>
            <span>{t(button.i18nLabelKey)}</span>
          </button>
        </Link>
      ))}
    </>
  );
}

function LanguageChooser({ className }: { className?: string }) {
  const { t, i18n } = useTranslation("common");
  const fetcher = useFetcher();

  const supportedLanguages = [
    { code: "en", label: t("language-english"), icon: "🇬🇧" },
    { code: "de", label: t("language-german"), icon: "🇩🇪" },
  ];

  const handleLanguageChange = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
    fetcher.submit(
      { lng: languageCode },
      { method: "post", action: "/global_loaders/set-language" },
    );
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

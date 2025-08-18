import { Link, UIMatch, useMatches } from "@remix-run/react";
import { ParseKeys } from "i18next";
import React, { type PropsWithChildren, useState } from "react";
import { useTranslation } from "react-i18next";

import { ActionBar } from "./action-bar";
import style from "./page.module.css";

type GlobalButtonConfig = {
  relativeRoute: string;
  i18nLabelKey: ParseKeys<"common">;
};

type GlobalButton = GlobalButtonConfig & {
  route: string;
};

export function conditionalShowGlobalButtons(buttons: {
  editButton?: boolean;
  deleteButton?: boolean;
}): { globalButtons: GlobalButtonConfig[] } {
  const editButton = { relativeRoute: "edit", i18nLabelKey: "toplevel-edit" as const };
  const deleteButton = { relativeRoute: "delete", i18nLabelKey: "toplevel-delete" as const };
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
  const { t } = useTranslation("common");

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

  const loginSection = isLoggedIn ? (
    <>
      <li>
        <Link to="/users/me">{t("nav-profile")}</Link>
      </li>
      <li>
        <Link to="/logout">{t("nav-logout")}</Link>
      </li>
    </>
  ) : (
    <>
      <li>
        <Link to="/login">{t("nav-login")}</Link>
      </li>
    </>
  );

  return (
    <div className={style.pageContainer}>
      <header>
        <button className={style.menuButton} onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
        <h1>{title}</h1>
        {globalButtonRequests.map((button) => (
          <Link key={button.route + button.i18nLabelKey} to={button.route}>
            {t(button.i18nLabelKey)}
          </Link>
        ))}
      </header>
      <nav className={menuOpen ? style.open : style.closed}>
        <ul>
          <li>
            <Link to="/">{t("nav-landing-page")}</Link>
          </li>
          <li>
            <Link to="/search">{t("nav-search")}</Link>
          </li>
          <li>
            <Link to="/projects">{t("nav-projects")}</Link>
          </li>
          <li>
            <Link to="/users">{t("nav-people")}</Link>
          </li>
          <li>
            <Link to="/">{t("nav-faq")}</Link>
          </li>
          {additionalNavItems}
          {loginSection}
        </ul>
      </nav>
      <div id="globalScrollContainer" className={style.innerContainer}>
        {children}
      </div>
      <footer>{isLoggedIn ? <ActionBar /> : <></>}</footer>
    </div>
  );
}

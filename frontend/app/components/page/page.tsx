import { Link, UIMatch, useMatches } from "@remix-run/react";
import { type PropsWithChildren, useState } from "react";
import { useTranslation } from "react-i18next";

import { ActionBar } from "./action-bar";
import style from "./page.module.css";

export const INCLUDE_EDIT_BUTTON = { showEditButtonInPageComponent: true };

export function conditionalShowEditButton(showButton: boolean) {
  return showButton ? INCLUDE_EDIT_BUTTON : {};
}

function anyLoaderHasShowEditButton(route: UIMatch) {
  return (
    typeof route.data === "object" &&
    route.data !== null &&
    "showEditButtonInPageComponent" in route.data &&
    route.data.showEditButtonInPageComponent
  );
}

export function Page({
  title,
  isLoggedIn,
  children,
}: PropsWithChildren<{ title: string; isLoggedIn: boolean }>) {
  const { t } = useTranslation("common");

  const [menuOpen, setMenuOpen] = useState(false);

  const matches = useMatches();
  const editButtonRequest = matches.find(anyLoaderHasShowEditButton);

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
        {editButtonRequest !== undefined ? (
          <Link to={editButtonRequest.pathname + "/edit"}>{t("toplevel-edit")}</Link>
        ) : (
          <></>
        )}
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
          {loginSection}
        </ul>
      </nav>
      <div id="globalScrollContainer" className={style.innerContainer}>
        {children}
      </div>
      <footer>{isLoggedIn ? <ActionBar t={t} /> : <></>}</footer>
    </div>
  );
}

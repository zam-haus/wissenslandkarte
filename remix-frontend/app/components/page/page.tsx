import { Link, useMatches } from "@remix-run/react";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import style from "./page.module.css";

export const INCLUDE_EDIT_BUTTON = { showEditButtonInPageComponent: true };

export function conditionalShowEditButton(showButton: boolean) {
  return showButton ? INCLUDE_EDIT_BUTTON : {};
}

export function Page({
  title,
  isLoggedIn,
  children,
}: PropsWithChildren<{ title: string; isLoggedIn: boolean }>) {
  const { t } = useTranslation("common");

  const matches = useMatches();
  const editButtonRequest = matches.find((route) => route.data["showEditButtonInPageComponent"]);

  if (!matches.some((route) => route.handle?.i18n.includes("common"))) {
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
        <h1>{title}</h1>
        {editButtonRequest !== undefined ? (
          <Link to={editButtonRequest.pathname + "/edit"}>{t("toplevel-edit")}</Link>
        ) : (
          <></>
        )}
      </header>
      <nav>
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
      <div className={style.innerContainer}>{children}</div>
    </div>
  );
}

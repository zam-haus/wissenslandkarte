import { Link } from "@remix-run/react";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import style from "./page.module.css";

export function Page({
  title,
  isLoggedIn,
  children,
}: PropsWithChildren<{ title: string; isLoggedIn: boolean }>) {
  const { t } = useTranslation("common");

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

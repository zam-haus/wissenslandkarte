import { Link } from "@remix-run/react";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

import style from "./page.module.css";

export function Page({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  const { t } = useTranslation("common");

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
        </ul>
      </nav>
      <div className={style.innerContainer}>{children}</div>
    </div>
  );
}

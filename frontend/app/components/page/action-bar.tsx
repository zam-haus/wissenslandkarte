import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import style from "./action-bar.module.css";

export function ActionBar() {
  const { t } = useTranslation("common");

  return (
    <nav className={style.actionBarNav}>
      <Link to="/projects/new">{t("action-bar-new")}</Link>
      <Link to="/projects/mine">{t("action-bar-projects")}</Link>
      <Link to="/projects/step/new" className={style.mainItem}>
        {t("action-bar-add")}
      </Link>
      <Link to="/search">{t("action-bar-search")}</Link>
      <Link to="/users/me">{t("action-bar-profile")}</Link>
    </nav>
  );
}

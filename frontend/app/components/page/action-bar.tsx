import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import style from "./action-bar.module.css";

export function ActionBar() {
  const { t } = useTranslation("common");

  return (
    <nav className="toolbar max" style={{ padding: "8px 0" }}>
      <Link className="vertical border small-round small" to="/projects/new">
        <i>post_add</i>
        <span>{t("action-bar-new")}</span>
      </Link>
      <Link className="vertical border small-round" to="/projects/mine">
        <i>handyman</i>
        <span>{t("action-bar-projects")}</span>
      </Link>
      <Link
        className="vertical border small-round extra primary medium-elevate"
        to="/projects/step/new"
      >
        <i>add</i>
        <span>{t("action-bar-add")}</span>
      </Link>
      <Link className="vertical border small-round" to="/search">
        <i>search</i>
        <span>{t("action-bar-search")}</span>
      </Link>
      <Link className="vertical border small-round" to="/users/me">
        <i>account_box</i>
        <span>{t("action-bar-profile")}</span>
      </Link>
    </nav>
  );
}

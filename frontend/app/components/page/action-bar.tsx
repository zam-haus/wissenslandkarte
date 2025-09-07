import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import style from "./action-bar.module.css";

export function ActionBar() {
  const { t } = useTranslation("common");

  return (
    <div className="center-align">
      <nav className="center-align group  fill connected primary toolbar">
        <Link className="button small left-round" to="/projects/new">
          <i>post_add</i>
          <span className="m l">{t("action-bar-new")}</span>
          <span className="s tooltip">{t("action-bar-new")}</span>
        </Link>
        <Link className={`button small no-round ${style["no-round-fix"]}`} to="/projects/mine">
          <i>handyman</i>
          <span className="m l">{t("action-bar-projects")}</span>
          <span className="s tooltip">{t("action-bar-projects")}</span>
        </Link>
        <Link className={`button large no-round ${style["no-round-fix"]}`} to="/projects/step/new">
          <i>add</i>
          <span className="m l">{t("action-bar-add")}</span>
          <span className="s tooltip">{t("action-bar-add")}</span>
        </Link>
        <Link className={`button small no-round ${style["no-round-fix"]}`} to="/search">
          <i>search</i>
          <span className="m l">{t("action-bar-search")}</span>
          <span className="s tooltip">{t("action-bar-search")}</span>
        </Link>
        <Link className="button small right-round" to="/users/me">
          <i>account_box</i>
          <span className="m l">{t("action-bar-profile")}</span>
          <span className="s tooltip">{t("action-bar-profile")}</span>
        </Link>
      </nav>
    </div>
  );
}

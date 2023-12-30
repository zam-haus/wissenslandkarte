import { useTranslation } from "react-i18next";

import { Link, NavLink, useSearchParams } from "@remix-run/react";

import styles from "./search-header.module.css";

export function SearchProjectPeopleSwitch() {
  const { t } = useTranslation("search");
  const [searchParams] = useSearchParams();
  searchParams.toString();

  return (
    <nav className={styles.switch}>
      <div>
        <NavLink to={`/search/projects?${searchParams.toString()}`}>
          {t("projects")}
        </NavLink>
      </div>
      <div>
        <Link to={`/search/people?${searchParams.toString()}`}>
          {t("people")}
        </Link>
      </div>
    </nav>
  );
}

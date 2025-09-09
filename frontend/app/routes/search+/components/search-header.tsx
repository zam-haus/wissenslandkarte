import { NavLink, useSearchParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";

export function SearchProjectPeopleSwitch() {
  const { t } = useTranslation("search");
  const [searchParams] = useSearchParams();
  searchParams.toString();

  return (
    <div className="tabs left-align">
      <NavLink to={`/search/projects?${searchParams.toString()}`}>
        <i>handyman</i>
        {t("projects")}
      </NavLink>
      <NavLink to={`/search/people?${searchParams.toString()}`}>
        <i>group</i>
        {t("people")}
      </NavLink>
    </div>
  );
}

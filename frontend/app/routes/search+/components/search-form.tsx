import { Form, useSearchParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { TagSelect } from "~/components/form-input/tag-select";

import styles from "./search-form.module.css";

export function getSearchQuery(searchParams: URLSearchParams) {
  const query = searchParams.get("q");
  const tagFilter = searchParams.getAll("tags");

  return { query, tagFilter };
}

export function SearchForm() {
  const { t } = useTranslation("search");
  const { t: tProjects } = useTranslation("projects");

  const [searchParams] = useSearchParams();
  const { query, tagFilter } = getSearchQuery(searchParams);

  return (
    <Form method="get">
      <label>
        {t("query")}
        <input
          className={styles.searchInput}
          type="text"
          name="q"
          placeholder="🔎"
          defaultValue={query ?? ""}
        />
      </label>
      {t("filter-tags")}
      <TagSelect
        defaultValue={tagFilter.map((it) => ({ id: "", name: it }))}
        initiallyAvailableTags={[]}
        t={tProjects}
        allowAddingNew={false}
      />

      <button type="submit">{t("search")}</button>
    </Form>
  );
}

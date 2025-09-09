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

  const [searchParams] = useSearchParams();
  const { query, tagFilter } = getSearchQuery(searchParams);

  return (
    <Form method="get" className={styles.form}>
      <fieldset>
        <legend>{t("query")}</legend>
        <div className="field prefix small-round border fill">
          <i className="front">search</i>
          <input
            type="text"
            name="q"
            placeholder={t("search-placeholder")}
            defaultValue={query ?? ""}
          />
          <span className="helper">{t("search-helper-text")}</span>
        </div>
      </fieldset>
      <fieldset>
        <legend>{t("filter-tags")}</legend>
        <TagSelect
          defaultValue={tagFilter.map((it) => ({ id: "", name: it }))}
          initiallyAvailableTags={[]}
          allowAddingNew={false}
        />
      </fieldset>

      <button className="margin-top" type="submit">
        {t("search")}
      </button>
    </Form>
  );
}

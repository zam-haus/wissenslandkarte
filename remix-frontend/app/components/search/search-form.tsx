import { useTranslation } from 'react-i18next';

import { Form, useSearchParams } from '@remix-run/react';

import styles from './search-form.module.css';

export function getSearchQuery(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  return query

}

export function SearchForm() {
  const { t } = useTranslation("search")

  const [searchParams] = useSearchParams();
  const query = searchParams.getAll("q");

  return <Form method="get">
    <input className={styles.searchInput} type="text" name="q" placeholder="🔎" defaultValue={query} />

    <button type="submit">
      {t("search")}
    </button>
  </Form>
}
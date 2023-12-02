import { useTranslation } from 'react-i18next';
import { mapDeserializedDates } from '~/components/date-rendering';
import { ProjectsList } from '~/components/projects/projects-list';
import { getProjectList, searchProjects } from '~/models/projects.server';

import { json } from '@remix-run/node';
import { Form, useLoaderData, useSearchParams } from '@remix-run/react';

import styles from './search._index.module.css';

import type { LoaderArgs } from '@remix-run/node';

export const loader = async ({
  request,
}: LoaderArgs) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (query === null || query.trim() === '') {
    const projects = await getProjectList()
    return json({ projects });
  }

  const projects = await searchProjects(query.split(" "));
  return json({ projects })
};

export const handle = {
  i18n: ["common", "search"],
};

export default function Search() {
  const { projects } = useLoaderData<typeof loader>();
  const { t } = useTranslation("search")

  const [searchParams] = useSearchParams();
  const query = searchParams.getAll("q");

  return <main>
    <Form method="get">
      <input className={styles.searchInput} type="text" name="q" placeholder="🔎" defaultValue={query} />

      <button type="submit">
        {t("search")}
      </button>
    </Form>

    <ProjectsList projects={projects.map(mapDeserializedDates("latestModificationDate"))}></ProjectsList>
  </main>
}
import { useTranslation } from 'react-i18next';
import { mapDeserializedDates } from '~/components/date-rendering';
import { ProjectsList } from '~/components/projects/projects-list';
import { getProjectList } from '~/models/projects.server';

import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

import type { LoaderArgs, V2_MetaFunction } from '@remix-run/node';
export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export const loader = async ({ params }: LoaderArgs) => {
  const projects = await getProjectList({ byNewestModification: true, limit: 5 })

  return json({ projects });
};

export const handle = {
  i18n: ["common", "landing-page"],
};

export default function Index() {
  const { t } = useTranslation("landing-page")
  const { projects } = useLoaderData<typeof loader>()

  return (
    <main>

      <p>{t("browse-prompt")}</p>

      <Link to="search">{t("search-button")}</Link>

      <h2>{t("newest-updates-headline")}</h2>
      <ProjectsList projects={projects.map(mapDeserializedDates("latestModificationDate"))}></ProjectsList>
    </main>
  );
}
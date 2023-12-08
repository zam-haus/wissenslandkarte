import { useTranslation } from 'react-i18next';
import { mapDeserializedDates } from '~/components/date-rendering';
import { ProjectsList } from '~/components/projects/projects-list';
import { getSearchQuery, SearchForm } from '~/components/search/search-form';
import { SearchProjectPeopleSwitch } from '~/components/search/search-header';
import { getProjectList, searchProjects } from '~/models/projects.server';

import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import type { LoaderArgs } from '@remix-run/node';
export const loader = async ({
  request,
}: LoaderArgs) => {
  const query = getSearchQuery(request)

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

  return <main>
    <SearchForm />
    <SearchProjectPeopleSwitch />
    <ProjectsList projects={projects.map(mapDeserializedDates("latestModificationDate"))}></ProjectsList>
  </main>
}
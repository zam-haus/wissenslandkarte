import { useTranslation } from 'react-i18next';
import { ProjectList } from '~/models/projects.server';

import { Link } from '@remix-run/react';

import { LocalDate } from '../date-rendering';
import localStyle from './project-list.module.css';

type StyleableParts = "projectEntry" | "projectTitle" | "projectModificationDate" | "projectMainPhoto"

export function ProjectsList({ projects, styles }: { projects: ProjectList[], styles?: { [key in StyleableParts]?: string } }) {
  const { t } = useTranslation("users")

  return <ul>
    {projects.map((project) =>
      <li key={project.id} className={localStyle.projectEntry + " " + styles?.projectEntry}>
        <Link to={`/projects/${encodeURIComponent(project.id)}`} className={styles?.projectTitle}>{project.title}</Link>
        <span className={styles?.projectModificationDate}>
          <LocalDate date={project.latestModificationDate}></LocalDate>
        </span>
        <img className={localStyle.projectMainPhoto + " " + styles?.projectMainPhoto} alt={t("project-photo-alt-text", { title: project.title })} src={project.mainPhoto} />
      </li>
    )}
  </ul>
}
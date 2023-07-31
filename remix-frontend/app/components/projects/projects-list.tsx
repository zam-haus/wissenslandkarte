
import { Project } from "@prisma/client";
import { LocalDate } from "../date-rendering";
import { useTranslation } from "react-i18next";

type StyleableParts = "projectEntry" | "projectTitle" | "projectModificationDate" | "projectMainPhoto"
type UsedProjectParts = Pick<Project, "id" | "title" | "latestModificationDate" | "mainPhoto">

export function ProjectsList({ projects, styles }: { projects: ProjectList[], styles?: { [key in StyleableParts]?: string } }) {
  const { t } = useTranslation("users")

  return <ul>
    {projects.map((project) =>
      <li key={project.id} className={styles?.projectEntry}>
        <span className={styles?.projectTitle}>{project.title}</span>
        <span className={styles?.projectModificationDate}>
          <LocalDate date={project.latestModificationDate}></LocalDate>
        </span>
        <img className={styles?.projectMainPhoto} alt={t("project-photo-alt-text", { title: project.title })} src={project.mainPhoto} />
      </li>
    )}
  </ul>
}
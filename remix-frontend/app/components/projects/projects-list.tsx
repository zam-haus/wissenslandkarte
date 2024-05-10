import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import type { ProjectListEntry } from "~/models/projects.server";

import { LocalDate } from "../date-rendering";
import localStyle from "./project-list.module.css";

type StyleableParts =
  | "projectEntry"
  | "projectTitle"
  | "projectModificationDate"
  | "projectMainPhoto";

export function ProjectsList({
  projects,
  styles,
}: {
  projects: ProjectListEntry[];
  styles?: { [key in StyleableParts]?: string };
}) {
  const { t } = useTranslation("users");

  return (
    <ul>
      {projects.map((project) => (
        <li key={project.id} className={localStyle.projectEntry + " " + styles?.projectEntry}>
          <Link to={`/projects/${encodeURIComponent(project.id)}`} className={styles?.projectTitle}>
            {project.title}
          </Link>
          <span className={styles?.projectModificationDate}>
            <LocalDate date={project.latestModificationDate}></LocalDate>
          </span>
          {project.mainPhoto === null ? (
            <div
              className={localStyle.projectMainPhoto + " " + (styles?.projectMainPhoto ?? "")}
            ></div>
          ) : (
            <img
              className={localStyle.projectMainPhoto + " " + (styles?.projectMainPhoto ?? "")}
              alt={t("project-photo-alt-text", { title: project.title })}
              src={project.mainPhoto}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import type { ProjectListEntry } from "~/models/projects.server";

import { LocalDate } from "../date-rendering";

import localStyle from "./project-list.module.css";

type StyleableParts =
  | "projectEntry"
  | "projectTitle"
  | "projectModificationDate"
  | "projectMainImage";

export function ProjectsList({
  projects,
  styles,
}: {
  projects: ProjectListEntry[];
  styles?: { [key in StyleableParts]?: string };
}) {
  const { t } = useTranslation("common");

  return (
    <ul className={localStyle.projectList}>
      {projects.map((project) => (
        <li
          key={project.id}
          className={localStyle.projectEntry + " " + (styles?.projectEntry ?? "")}
        >
          <Link to={`/projects/${encodeURIComponent(project.id)}`} className={styles?.projectTitle}>
            {project.title}
          </Link>
          <span className={styles?.projectModificationDate}>
            <LocalDate date={project.latestModificationDate}></LocalDate>
          </span>
          {project.mainImage === null ? (
            <div
              className={localStyle.projectMainImage + " " + (styles?.projectMainImage ?? "")}
            ></div>
          ) : (
            <img
              loading="lazy"
              className={localStyle.projectMainImage + " " + (styles?.projectMainImage ?? "")}
              alt={t("project-image-alt-text", { title: project.title })}
              src={project.mainImage}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

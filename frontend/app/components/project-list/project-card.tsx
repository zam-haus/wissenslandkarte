import { useTranslation } from "react-i18next";

import type { ProjectListEntry } from "~/database/repositories/projects.server";

import { LocalDate } from "../date-rendering";
import { ProjectTagList } from "../tags/tags";

import styles from "./project-card.module.css";

export type ProjectCardProps = ProjectListEntry;

export function ProjectCard({
  project,
  className,
}: {
  project: ProjectCardProps;
  className?: string;
}) {
  const { t } = useTranslation("common");

  return (
    <article
      className={`no-padding primary-container no-elevate ${styles.projectCard} ${className}`}
    >
      <div className="grid no-space">
        <div className="s4">
          {project.mainImage === null ? (
            <div className={styles.projectMainImagePlaceholder + " surface-variant "}></div>
          ) : (
            <img
              loading="lazy"
              className={`responsive ${styles.projectMainImage}`}
              alt={t("project-image-alt-text", { title: project.title })}
              src={project.mainImage}
            />
          )}
        </div>
        <div className="s8">
          <h3
            className={`secondary ${styles.projectTitle} no-round top-right-round no-margin small-padding`}
          >
            {project.title}
          </h3>
          <span className="padding">
            <LocalDate date={project.latestModificationDate}></LocalDate>
            <ProjectTagList tags={project.tags} className="" />
          </span>
        </div>
      </div>
    </article>
  );
}

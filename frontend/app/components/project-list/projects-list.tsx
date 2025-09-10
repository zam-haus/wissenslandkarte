import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import type { ProjectListEntry } from "~/database/repositories/projects.server";

import { LocalDate } from "../date-rendering";
import { ProjectTagList } from "../tags/tags";

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

  return projects.map((project) => (
    <Link
      key={project.id}
      to={`/projects/${encodeURIComponent(project.id)}`}
      className={localStyle.projectEntry}
    >
      <article className={`no-padding primary-container no-elevate ${localStyle.projectCard}`}>
        <div className="grid no-space">
          <div className="s4">
            {project.mainImage === null ? (
              <div
                className={
                  localStyle.projectMainImagePlaceholder +
                  " surface-variant " +
                  (styles?.projectMainImage ?? "")
                }
              ></div>
            ) : (
              <img
                loading="lazy"
                className={`responsive ${localStyle.projectMainImage} ${styles?.projectMainImage ?? ""}`}
                alt={t("project-image-alt-text", { title: project.title })}
                src={project.mainImage}
              />
            )}
          </div>
          <div className="s8">
            <h3
              className={`secondary ${localStyle.projectTitle} no-round top-right-round no-margin small-padding`}
            >
              {project.title}
            </h3>
            <span className={`${styles?.projectModificationDate} padding`}>
              <LocalDate date={project.latestModificationDate}></LocalDate>
              <ProjectTagList tags={project.tags} className="" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  ));
}

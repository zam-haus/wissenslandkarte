import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import type { ProjectListEntry } from "~/database/repositories/projects.server";

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

  return projects.map((project) => (
    <Link
      to={`/projects/${encodeURIComponent(project.id)}`}
      style={{ display: "inline-block", margin: "18px" }}
    >
      <article className="no-padding border" style={{ maxWidth: "500px" }}>
        <div className="grid no-space">
          <div className="s4">
            {project.mainImage === null ? (
              <div
                className={localStyle.projectMainImage + " " + (styles?.projectMainImage ?? "")}
              ></div>
            ) : (
              <img
                loading="lazy"
                className="responsive"
                alt={t("project-image-alt-text", { title: project.title })}
                src={project.mainImage}
              />
            )}
          </div>
          <div className="s8">
            <div className="padding">
              <h3 style={{ fontSize: "1.5rem" }}>{project.title}</h3>
              <span className={styles?.projectModificationDate}>
                <LocalDate date={project.latestModificationDate}></LocalDate>
              </span>{" "}
            </div>
          </div>
        </div>
      </article>
    </Link>
  ));
}

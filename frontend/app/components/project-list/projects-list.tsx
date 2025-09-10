import { Link } from "@remix-run/react";

import type { ProjectListEntry } from "~/database/repositories/projects.server";

import { ProjectCard } from "./project-card";
import localStyle from "./project-list.module.css";

export function ProjectsList({ projects }: { projects: ProjectListEntry[] }) {
  return projects.map((project) => (
    <Link
      key={project.id}
      to={`/projects/${encodeURIComponent(project.id)}`}
      className={localStyle.projectEntry}
    >
      <ProjectCard project={project} />
    </Link>
  ));
}

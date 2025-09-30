import { useNavigate } from "@remix-run/react";

import type { ProjectListEntry } from "~/database/repositories/projects.server";

import { ProjectCard } from "./project-card";
import localStyle from "./project-list.module.css";

export function ProjectsList({ projects }: { projects: ProjectListEntry[] }) {
  const navigate = useNavigate();

  function handleCardClick(event: React.MouseEvent<HTMLElement>, id: string) {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement | null;
    if (target && target.closest("a, button, input, textarea, select")) return;
    navigate(`/projects/${encodeURIComponent(id)}`);
  }

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/projects/${encodeURIComponent(id)}`);
    }
  }

  return projects.map((project) => (
    <div
      key={project.id}
      role="link"
      tabIndex={0}
      className={localStyle.projectEntry}
      onClick={(e) => handleCardClick(e, project.id)}
      onKeyDown={(e) => handleCardKeyDown(e, project.id)}
    >
      <ProjectCard project={project} />
    </div>
  ));
}

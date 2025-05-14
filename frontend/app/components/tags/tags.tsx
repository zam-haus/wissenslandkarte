import type { Tag } from "@prisma/client";
import { Link } from "@remix-run/react";

import localStyles from "./tags.module.css";

export function ProjectTagList({ tags, className }: { tags: Tag[]; className: string }) {
  return (
    <ul className={[className, localStyles.tagList].join(" ")}>
      {tags.map((tag) => (
        <TagElem
          key={tag.id}
          text={tag.name}
          url={"/search/projects?tags=" + encodeURIComponent(tag.name)}
        />
      ))}
    </ul>
  );
}

export function PeopleTagList({ tags, className }: { tags: Tag[]; className?: string }) {
  return (
    <ul className={[className, localStyles.tagList].join(" ")}>
      {tags.map((tag) => (
        <TagElem
          key={tag.id}
          text={tag.name}
          url={"/search/people?tags=" + encodeURIComponent(tag.name)}
        />
      ))}
    </ul>
  );
}

function TagElem({ url, text }: { url: string; text: string }) {
  return (
    <li className={localStyles.tag}>
      <Link to={url}>{text}</Link>
    </li>
  );
}

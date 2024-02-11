import type { Tag } from "@prisma/client";
import { Link } from "@remix-run/react";

export function ProjectTagList({ tags, className }: { tags: Tag[]; className: string }) {
  return (
    <ul className={className}>
      {tags.map((tag) => (
        <TagElem
          key={tag.id}
          text={tag.name}
          url={"/search/projects?q=" + encodeURIComponent(tag.name)}
        />
      ))}
    </ul>
  );
}

export function PeopleTagList({ tags, className }: { tags: Tag[]; className?: string }) {
  return (
    <ul className={className}>
      {tags.map((tag) => (
        <TagElem
          key={tag.id}
          text={tag.name}
          url={"/search/people?q=" + encodeURIComponent(tag.name)}
        />
      ))}
    </ul>
  );
}

function TagElem({ url, text }: { url: string; text: string }) {
  return (
    <li>
      <Link to={url}>{text}</Link>
    </li>
  );
}

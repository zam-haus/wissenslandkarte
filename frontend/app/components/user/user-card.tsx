import { Link } from "@remix-run/react";

import { UserGetPayload } from "prisma/generated/models";

import { LocalDate } from "../date-rendering";
import { PeopleTagList } from "../tags/tags";

import styles from "./user-card.module.css";
import { UserImage } from "./user-image";

export type UserCardProps = UserGetPayload<{
  select: {
    username: true;
    image: true;
    description: true;
    tags: true;
    registrationDate: true;
  };
}>;
export function UserCard({ user, className }: { user: UserCardProps; className?: string }) {
  return (
    <article className={`${styles.userCard} no-padding no-elevate primary-container ${className}`}>
      <Link className={styles.userCardLink} to={`/users/${encodeURIComponent(user.username)}`}>
        <header className={`secondary small-padding small-round ${styles.userHeader}`}>
          <h3>{user.username}</h3>
          <p className={`no-margin ${styles.userRegistrationDate}`}>
            <LocalDate date={user.registrationDate} />
          </p>
          {user.image ? <UserImage className={styles.userImage} {...user} /> : null}
        </header>
      </Link>
      <p className="small-padding">{user.description}</p>
      <PeopleTagList className="no-margin" tags={user.tags} />
    </article>
  );
}

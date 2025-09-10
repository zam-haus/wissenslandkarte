import { useTranslation } from "react-i18next";

import { UserGetPayload } from "prisma/generated/models";

import { LocalDate } from "../date-rendering";
import { PeopleTagList } from "../tags/tags";

import styles from "./user-card.module.css";

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
  const { t } = useTranslation("common");

  return (
    <article className={`${styles.userCard} no-padding no-elevate primary-container ${className}`}>
      <header className={`secondary small-padding small-round ${styles.userHeader}`}>
        <h3>{user.username}</h3>
        <p className={`no-margin ${styles.userRegistrationDate}`}>
          <LocalDate date={user.registrationDate} />
        </p>
        {user.image ? (
          <img
            src={user.image}
            alt={t("profile-picture-alt-text", { username: user.username })}
            className={styles.userImage}
          />
        ) : null}
      </header>
      <p className="small-padding">{user.description}</p>
      <PeopleTagList className="no-margin" tags={user.tags} />
    </article>
  );
}

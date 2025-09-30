import { useNavigate } from "@remix-run/react";

import { UserCard, UserCardProps } from "./user-card";
import styles from "./user-list.module.css";

export function UserList({ users }: { users: (UserCardProps & { id: string })[] }) {
  const navigate = useNavigate();

  function handleCardClick(event: React.MouseEvent<HTMLElement>, username: string) {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement | null;
    if (target && target.closest("a, button, input, textarea, select")) return;
    navigate(`/users/${encodeURIComponent(username)}`);
  }

  function handleCardKeyDown(event: React.KeyboardEvent<HTMLElement>, username: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/users/${encodeURIComponent(username)}`);
    }
  }

  return (
    <div className={styles.userList}>
      {users.map((user) => (
        <div
          role="link"
          tabIndex={0}
          aria-label={user.username}
          className={styles.userLink}
          key={user.id}
          onClick={(e) => handleCardClick(e, user.username)}
          onKeyDown={(e) => handleCardKeyDown(e, user.username)}
        >
          <UserCard user={user} />
        </div>
      ))}
    </div>
  );
}

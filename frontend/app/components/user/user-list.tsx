import { Link } from "@remix-run/react";

import { UserCard, UserCardProps } from "./user-card";
import styles from "./user-list.module.css";

export function UserList({ users }: { users: (UserCardProps & { id: string })[] }) {
  return (
    <div className={styles.userList}>
      {users.map((user) => (
        <Link
          className={styles.userLink}
          key={user.id}
          to={`/users/${encodeURIComponent(user.username)}`}
        >
          <UserCard user={user} />
        </Link>
      ))}
    </div>
  );
}

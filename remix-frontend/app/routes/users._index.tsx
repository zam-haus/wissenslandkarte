import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getUsers } from "~/models/user.server";

export const loader = async () => {
  return json({
    users: await getUsers()
  });
};

export default function Users() {
  const { users } = useLoaderData<typeof loader>();

  return <main>
    <h1>Users</h1>
    <ul>
      {users.map(
        (user) => <li key={user.id}>
          <Link to={encodeURIComponent(user.username)}>{user.username}</Link>
        </li>
      )}
    </ul>
  </main>
}
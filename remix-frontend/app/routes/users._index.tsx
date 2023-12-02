import { getUserList } from '~/models/user.server';

import { json } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';

export const loader = async () => {
  return json({
    users: await getUserList()
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
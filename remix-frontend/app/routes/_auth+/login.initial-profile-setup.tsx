import { json, type LoaderArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";

import { Page } from "~/components/page/page";
import { authenticator } from "~/lib/authentication.server";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await authenticator.isAuthenticated(request); //, { failureRedirect: "/" });

  console.log("edit: ", user);

  if (user === null) {
    return redirect("/");
  }

  return json({ user });
};

export default function SetupProfile() {
  const navigate = useNavigate();
  const { user } = useLoaderData<typeof loader>();
  return (
    <Page title="Setup Profile" isLoggedIn={true}>
      <h2>Welcome {user.username}</h2>
      <p>
        We haven chosen this username for you: <strong>{user.username}</strong>. This username is
        <strong>publicly visible.</strong>
      </p>

      <Form>
        <input type="hidden" name="accept-username" />
        <button type="submit">That is ok</button>
        <button onClick={() => navigate(`/users/${user.username}/edit`)}>
          I want to change that.
        </button>
      </Form>
    </Page>
  );
}

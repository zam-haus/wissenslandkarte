import type { ActionArgs, TypedResponse } from "@remix-run/node";
import { json, type LoaderArgs, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import { Page } from "~/components/page/page";
import { authenticator } from "~/lib/authentication.server";

export const action = async ({ request }: ActionArgs): Promise<TypedResponse<never | {}>> => {
  if ((await request.formData()).get("acceptUsername") === "true") {
    //TODO: should we create the user here instead of creating them upon login?
    return redirect("/");
  }

  return json({});
};

export const loader = async ({ request }: LoaderArgs) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/" });

  return json({ user });
};

export default function SetupProfile() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <Page title="Setup Profile" isLoggedIn={true}>
      <h2>Welcome {user.username}</h2>
      <p>
        We haven chosen this username for you: <strong>{user.username}</strong>. This username is{" "}
        <strong>publicly visible.</strong>
      </p>

      <Form method="POST">
        <input type="hidden" name="acceptUsername" value="true" />
        <button type="submit">That is ok</button>
        <Link to={`/users/${user.username}/edit`}>I want to change that.</Link>
      </Form>
    </Page>
  );
}

import type { ActionArgs, TypedResponse } from "@remix-run/node";
import { json, type LoaderArgs, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { Page } from "~/components/page/page";
import { prisma } from "~/db.server";
import { getSession } from "~/lib/session";

import { defaultSessionKey } from "./lib/handleKeycloakCallback.server";

export const tempUserSessionKey = "tempUser";

export const action = async ({ request }: ActionArgs): Promise<TypedResponse<never | {}>> => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has(tempUserSessionKey)) {
    return redirect("/");
  }
  const user = session.get(tempUserSessionKey);

  const username = (await request.formData()).get("username");
  invariant(username, "username must be provided");

  const newUser = await prisma.user.create({
    data: { ...user, id: undefined, setupCompleted: true },
  });

  session.unset(tempUserSessionKey);
  session.set(defaultSessionKey, newUser); // TODO: When the auth library has been updated, this should be in a "setLoggedInUser" function

  const sessionData = await session.commit();
  const headers = new Headers({ "Set-Cookie": sessionData });

  return redirect(`/users/${newUser.username}/edit`, { headers });

  //TODO: handle username taken (see username.edit)
};

export const loader = async ({ request }: LoaderArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (!session.has(tempUserSessionKey)) {
    return redirect("/");
  }
  const user = session.get(tempUserSessionKey); // TODO: Move cookie header getting into getSession //TODO: why is this any?

  return json({ user });
};

export const handle = {
  i18n: ["login"],
};

export default function SetupProfile() {
  const { user } = useLoaderData<typeof loader>();
  const { t } = useTranslation("login");

  return (
    <Page title="Setup Profile" isLoggedIn={true}>
      <h2>{t("welcome", { firstname: user.firstName })}</h2>

      <Form method="POST">
        <label>
          {t("username-prompt")}
          <input type="text" name="username" defaultValue={user.username} />
        </label>
        {t("next-step")}
        <button type="submit">{t("create")}</button>
      </Form>
    </Page>
  );
}

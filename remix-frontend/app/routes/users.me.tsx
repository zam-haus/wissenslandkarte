import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import { mapDeserializedDates, withDeserializedDates } from "~/components/date-rendering";
import { INCLUDE_EDIT_BUTTON } from "~/components/page/page";
import { authenticator } from "~/lib/authentication.server";
import { getUserOverview } from "~/models/user.server";

import { UserMain } from "./users.$username";

export const loader = async ({ request }: LoaderArgs) => {
  const user = await authenticator.isAuthenticated(request, { failureRedirect: "/users" });

  const userOverview = await getUserOverview(user.username);
  invariant(userOverview, `User not found: ${user.username}`);

  return json({ user: userOverview, ...INCLUDE_EDIT_BUTTON });
};

export const handle = {
  i18n: ["common", "users"],
};

export default function Me() {
  const { t } = useTranslation("users");
  const { user } = useLoaderData<typeof loader>();

  const deser = {
    ...withDeserializedDates(user, "registrationDate"),
    memberProjects: user.memberProjects.map(mapDeserializedDates("latestModificationDate")),
    ownedProjects: user.ownedProjects.map(mapDeserializedDates("latestModificationDate")),
  };

  return (
    <>
      <header>
        <h1>{t("my-profile")}</h1>
      </header>
      <aside>
        <Link to="./edit">Edit</Link>
      </aside>

      <UserMain user={deser} />
    </>
  );
}

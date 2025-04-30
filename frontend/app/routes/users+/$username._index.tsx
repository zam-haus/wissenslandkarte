import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";

import {
  mapDeserializedDates,
  renderDate,
  withDeserializedDates,
} from "~/components/date-rendering";
import { conditionalShowEditButton } from "~/components/page/page";
import { ProjectsList } from "~/components/projects/projects-list";
import { PeopleTagList } from "~/components/tags";
import { UserImage } from "~/components/users/user-image";
import { isThisUserLoggedIn } from "~/lib/authorization.server";
import type { UserOverview } from "~/models/user.server";
import { getUserOverview } from "~/models/user.server";

import styles from "./$username._index.module.css";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  invariant(params.username, `params.slug is required`);

  const user = await getUserOverview(params.username);
  invariant(user, `User not found: ${params.username}`);

  return { user, ...conditionalShowEditButton(await isThisUserLoggedIn(request, user)) };
};

export const handle = {
  i18n: ["users"],
};

export default function User() {
  const { t } = useTranslation("users");
  const { user } = useLoaderData<typeof loader>();

  const deserializedUser = {
    ...withDeserializedDates(user, "registrationDate"),
    memberProjects: user.memberProjects.map(mapDeserializedDates("latestModificationDate")),
    ownedProjects: user.ownedProjects.map(mapDeserializedDates("latestModificationDate")),
  };

  return (
    <>
      <header>
        <h1>{t("my-profile")}</h1>
      </header>

      <UserMain user={deserializedUser} />
    </>
  );
}

export function UserMain({ user }: { user: UserOverview }) {
  const { t, i18n } = useTranslation("users");

  const allProjects = [...user.memberProjects, ...user.ownedProjects];
  allProjects.sort((a, b) =>
    a.latestModificationDate < b.latestModificationDate
      ? 1
      : a.latestModificationDate == b.latestModificationDate
        ? 0
        : -1,
  );

  return (
    <main>
      <header>
        <UserImage {...user} t={t} className={styles.atRight} />
        <h2>{user.username}</h2>

        <p>
          {t("projects-counter", {
            count: user.memberProjects.length + user.ownedProjects.length,
          })}
        </p>

        <p>
          {t("registered-since", {
            date: renderDate(user.registrationDate, i18n.language),
          })}
        </p>
      </header>

      <section>
        <p className={styles.fullWidth}>{user.description}</p>

        <Link to="./contact" className="send-message">
          {t("send-message")}
        </Link>

        <PeopleTagList className={styles.tagList} tags={user.tags} />
      </section>

      <section>
        <h3>{t("projects-headline")}</h3>
        <ProjectsList projects={allProjects} styles={styles}></ProjectsList>
      </section>
    </main>
  );
}

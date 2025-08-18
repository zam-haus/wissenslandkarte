import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { renderDate } from "~/components/date-rendering";
import { CommonMarkdown } from "~/components/markdown";
import { conditionalShowGlobalButtons } from "~/components/page/page";
import { ProjectsList } from "~/components/project-list/projects-list";
import { PeopleTagList } from "~/components/tags/tags";
import { UserImage } from "~/components/user-image/user-image";
import type { UserOverview } from "~/database/repositories/user.server";
import { getUserOverview } from "~/database/repositories/user.server";
import { isThisUserLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";

import styles from "./$username._index.module.css";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.username, "username is required");

  const user = await getUserOverview(params.username);
  assertExistsOr404(user, `User not found: ${params.username}`);

  const ownerLoggedIn = await isThisUserLoggedIn(request, user);
  const adminLoggedIn = await loggedInUserHasRole(request, Roles.UserEditor);
  return {
    user,
    ...conditionalShowGlobalButtons({ editButton: ownerLoggedIn || adminLoggedIn }),
  };
};

export default function User() {
  const { t } = useTranslation("users");
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <header>
        <h1>{t("my-profile")}</h1>
      </header>

      <UserMain user={user} />
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
        <UserImage {...user} className={styles.atRight} />
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
        <div className={styles.fullWidth}>
          <CommonMarkdown>{user.description}</CommonMarkdown>
        </div>

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

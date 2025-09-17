import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Handle } from "types/handle";
import { renderDate } from "~/components/date-rendering";
import { CommonMarkdown } from "~/components/markdown";
import { conditionalShowGlobalButtons } from "~/components/page/page";
import { ProjectsList } from "~/components/project-list/projects-list";
import { PeopleTagList } from "~/components/tags/tags";
import { UserImage } from "~/components/user/user-image";
import { getUserOverview } from "~/database/repositories/user.server";
import i18next from "~/i18next.server";
import { isThisUserLoggedIn, loggedInUserHasRole, Roles } from "~/lib/authorization.server";
import { assertExistsOr400, assertExistsOr404 } from "~/lib/dataValidation";

import styles from "./$username._index.module.css";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  assertExistsOr400(params.username, "username is required");

  const user = await getUserOverview(params.username);
  assertExistsOr404(user, `User not found: ${params.username}`);

  const ownerLoggedIn = await isThisUserLoggedIn(request, user);
  const adminLoggedIn = await loggedInUserHasRole(request, Roles.UserEditor);
  let pageTitleOverride: { pageTitleOverride?: string } = {};
  if (ownerLoggedIn) {
    const t = await i18next.getFixedT(request, "users");
    pageTitleOverride = { pageTitleOverride: t("titles.my-profile") };
  }
  return {
    user,
    ...conditionalShowGlobalButtons({ editButton: ownerLoggedIn || adminLoggedIn }),
    ...pageTitleOverride,
  };
};

export const handle: Handle<"users"> = {
  pageTitleOverride: { ns: "users", key: "titles.single-user" },
};

export default function User() {
  const { t, i18n } = useTranslation("users");
  const { user } = useLoaderData<typeof loader>();

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
      <header className={`primary-container small-round padding ${styles.userHeader}`}>
        <UserImage {...user} className={styles.userImage} />
        <h2 className={`no-margin ${styles.username}`}>{user.username}</h2>

        <p className={styles.projectsCounter}>
          <i>handyman</i>
          {t("projects-counter", {
            count: user.memberProjects.length + user.ownedProjects.length,
          })}
        </p>

        <p className={styles.registrationDate}>
          <i>person_add</i>
          {t("registered-since", {
            date: renderDate(user.registrationDate, i18n.language),
          })}
        </p>

        <Link to="./contact" className={`button top-margin ${styles.sendMessage}`}>
          <i>email</i>
          {t("send-message")}
        </Link>
      </header>

      <section>
        <div className={styles.fullWidth}>
          <CommonMarkdown>{user.description}</CommonMarkdown>
        </div>
        <PeopleTagList className={styles.tagList} tags={user.tags} />
      </section>

      <section>
        <h3>{t("projects-headline")}</h3>
        <ProjectsList projects={allProjects}></ProjectsList>
      </section>
    </main>
  );
}

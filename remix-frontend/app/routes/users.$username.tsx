
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";
import { getUserOverview } from "~/models/user.server";
import { LocalDate, renderDate } from "~/shared/date-rendering"

import styles from "./users.$username.module.css"

export const loader = async ({ params }: LoaderArgs) => {
  invariant(params.username, `params.slug is required`);

  const user = await getUserOverview(params.username)
  invariant(user, `User not found: ${params.username}`);

  return json({ user });
};

export const handle = {
  i18n: ["common", "users"],
};

export default function User() {
  const { t, i18n } = useTranslation("users")
  const { user } = useLoaderData<typeof loader>();

  const allProjects = [...user.memberProjects, ...user.ownedProjects]
  allProjects.sort((a, b) => (a.latestModificationDate < b.latestModificationDate ? 1 : (a.latestModificationDate == b.latestModificationDate ? 0 : -1)))

  return (<>
    <header>
      <h1>{t("my-profile")}</h1>
    </header>

    <main>
      <header>
        <img
          src={user.image}
          alt={t("profile-picture-alt-text")}
          className={`${styles.userImage} ${styles.atRight}`}
        />
        <h2>
          {user.username}
        </h2>

        <p>
          {t("projects-counter", { count: user.memberProjects.length + user.ownedProjects.length })}
        </p>

        <p>
          {t("registered-since", {
            date: renderDate(user.registrationDate, i18n.language),
          })}
        </p>
      </header>

      <section>
        <p className={styles.fullWidth}>
          {user.description}
        </p>

        <button className="primary send-message" onClick={() => console.log("message")}>
          {t("send-message")}
        </button>

        <ul className={styles.tagList}>
          {user.tags.map((tag) => <li key={tag.id}>{tag.name}</li>)}
        </ul>
      </section>

      <section>
        <h3>{t("projects-headline")}</h3>
        <ul>
          {allProjects.map((project) =>
            <li key={project.id} className={styles.projectEntry}>
              <span className={styles.projectTitle}>{project.title}</span>
              <span className={styles.projectModificationDate}><LocalDate date={project.latestModificationDate}></LocalDate></span>
              <img className={styles.projectMainPhoto} alt={t("project-photo-alt-text", { title: project.title })} src={project.mainPhoto} />
            </li>
          )}
        </ul>
      </section>

    </main >
  </>);
}
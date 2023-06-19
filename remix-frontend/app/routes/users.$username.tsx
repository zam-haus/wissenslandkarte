
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import invariant from "tiny-invariant";
import { getUser } from "~/models/user.server";
import { Temporal } from "@js-temporal/polyfill"

import styles from "./users.$username.module.css"

export const loader = async ({ params }: LoaderArgs) => {
  invariant(params.username, `params.slug is required`);

  const user = await getUser(params.username)
  invariant(user, `User not found: ${params.username}`);

  return json({ user });
};

export const handle = {
  i18n: ["common", "users"],
};

export default function User() {
  const { t, i18n } = useTranslation("users")
  const { user } = useLoaderData<typeof loader>();

  return (<main>
    <header>
      <img
        src={user.image}
        alt={t("profile-picture-alt-text")}
        className={`${styles.userImage} ${styles.atRight}`}
      />
      <h3>
        {user.username}
      </h3>

      <p>
        {t("projects-counter", { count: 0 /*user.projectsShortInfo.length*/ })}
      </p>

      <p>
        {t("registered-since", {
          date: Temporal.Instant.from(user.registrationDate).toLocaleString(i18n.language),
        })}
      </p>
    </header>

    <p className={styles.fullWidth}>
      {user.description}
    </p>

    <button className="primary send-message" onClick={() => console.log("message")}>
      <div className="icon"><EnvelopeIcon /></div>
      {t("send-message")}
    </button>

    <ul className={styles.tagList}>
      {/* {user.tags.map((tag) => <li key={tag}>{tag}</li>)} */}
    </ul>

    <div>TODO: Projekte kommen hier...</div>
  </main >
  );
}

function EnvelopeIcon() {
  return <>TODO: Icons</>
}
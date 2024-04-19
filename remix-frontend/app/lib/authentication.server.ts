import type { User } from "@prisma/client";
import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { KeycloakStrategy } from "remix-keycloak";

import { prisma } from "~/db.server";

import { getFromEnv, getFromEnvOrThrow } from "./environment";
import { sessionStorage } from "./session";

export const zamKeycloakStrategyName = "zam-keycloak";
export const fakeLoginOnDevStrategyName = "fake-login";

export const enum LoginErrorReason {
  emailNotVerified = "emailNotVerified",
}

export const authenticator = new Authenticator<User>(sessionStorage, {
  throwOnError: true,
});

if (getFromEnv("DANGER_ENABLE_FAKE_LOGIN_ON_DEV", Boolean)) {
  if (process.env.NODE_ENV !== "development") {
    console.warn(
      "WARNING: DANGER_ENABLE_FAKE_LOGIN_ON_DEV should not be set in non-dev mode. Ignoring."
    );
  } else {
    const requiredPassword = getFromEnvOrThrow("DANGER_FAKE_LOGIN_PASSWORD");
    const fakeLoginStrategy = new FormStrategy(async ({ form }) => {
      let password = form.get("password");
      if (password !== requiredPassword) {
        throw Error("Could not login and/or register");
      }
      const user = await prisma.user.findFirst();
      console.log(user);
      if (user === null) {
        console.error("No user found in database. Fake login failed");
        throw Error("No user found.");
      }
      return user;
    });
    authenticator.use(fakeLoginStrategy, fakeLoginOnDevStrategyName);
  }
}

if (process.env["AUTH_ENABLE_ZAM_KEYCLOACK"]) {
  const zamKeycloak = new KeycloakStrategy(
    {
      useSSL: true,
      domain: getFromEnvOrThrow("AUTH_ZAM_KEYCLOAK_DOMAIN"),
      realm: getFromEnvOrThrow("AUTH_ZAM_KEYCLOAK_REALM"),
      clientID: getFromEnvOrThrow("AUTH_ZAM_KEYCLOAK_CLIENT_ID"),
      clientSecret: getFromEnvOrThrow("AUTH_ZAM_KEYCLOAK_CLIENT_SECRET"),
      callbackURL: getFromEnvOrThrow("AUTH_CALLBACK_BASE") + "/auth/zam-keycloak/callback",
    },
    async ({ profile }): Promise<User> => {
      const user = await prisma.user.findFirst({
        where: { keycloakId: profile.id },
      });

      if (user !== null) {
        if (
          user.firstName !== profile.name.givenName ||
          user.lastName !== profile.name.familyName
        ) {
          await prisma.user.update({
            data: {
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
            },
            where: { id: user.id },
          });
        }
        return user;
      }

      const createdUser = await prisma.user.create({
        data: {
          keycloakId: profile.id,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          contactEmailAddress: profile.emails[0].value,
          isContactEmailAddressPublic: false,
          registrationDate: new Date(), // TODO: Is this correct or do we need some other kind of date?
          username: profile.displayName,
        },
      });

      if (createdUser !== null) {
        return createdUser;
      }

      throw Error("Could not login and/or register");
    }
  );
  authenticator.use(zamKeycloak, zamKeycloakStrategyName);
}

import type { User } from "@prisma/client";
import type { StrategyVerifyCallback } from "remix-auth";
import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import type { OAuth2StrategyVerifyParams } from "remix-auth-oauth2";
import type { KeycloakExtraParams, KeycloakProfile } from "remix-keycloak";
import { KeycloakStrategy } from "remix-keycloak";

import { prisma } from "~/db.server";

import { environment } from "./environment";
import { sessionStorage } from "./session";

export const zamKeycloakStrategyName = "zam-keycloak";
export const devKeycloakStrategyName = "dev-keycloak";
export const fakeLoginOnDevStrategyName = "fake-login";

export const enum LoginErrorReason {
  emailNotVerified = "emailNotVerified",
}

export const authenticator = new Authenticator<User>(sessionStorage, {
  throwOnError: true,
});

setupFakeLoginStrategy();
setupZamKeycloakLogin();
setupDevKeycloakLogin();

function setupFakeLoginStrategy() {
  if (environment.auth.DANGER_ENABLE_FAKE_LOGIN_ON_DEV) {
    if (!environment.IS_DEV_MODE) {
      console.warn(
        "WARNING: DANGER_ENABLE_FAKE_LOGIN_ON_DEV should not be set in non-dev mode. Ignoring."
      );
    } else {
      const requiredPassword = environment.auth.DANGER_FAKE_LOGIN_PASSWORD;
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
}

function setupZamKeycloakLogin() {
  if (environment.auth.ENABLE_ZAM_KEYCLOACK) {
    const zamKeycloak = new KeycloakStrategy(
      {
        useSSL: true,
        domain: environment.auth.ZAM_KEYCLOAK_DOMAIN,
        realm: environment.auth.ZAM_KEYCLOAK_REALM,
        clientID: environment.auth.ZAM_KEYCLOAK_CLIENT_ID,
        clientSecret: environment.auth.ZAM_KEYCLOAK_CLIENT_SECRET,
        callbackURL: environment.auth.CALLBACK_BASE + "/auth/zam-keycloak/callback",
      },
      handleKeycloakLogin("zamKeycloak")
    );
    authenticator.use(zamKeycloak, zamKeycloakStrategyName);
  }
}

function setupDevKeycloakLogin() {
  if (environment.IS_DEV_MODE) {
    const devKeycloak = new KeycloakStrategy(
      {
        useSSL: false,
        domain: environment.auth.DEV_KEYCLOAK_DOMAIN,
        realm: environment.auth.DEV_KEYCLOAK_REALM,
        clientID: environment.auth.DEV_KEYCLOAK_CLIENT_ID,
        clientSecret: environment.auth.DEV_KEYCLOAK_CLIENT_SECRET,
        callbackURL: environment.auth.CALLBACK_BASE + "/auth/dev-keycloak/callback",
      },
      handleKeycloakLogin("devKeycloak")
    );
    authenticator.use(devKeycloak, devKeycloakStrategyName);
  }
}

function handleKeycloakLogin(
  keycloakInstanceName: string
): StrategyVerifyCallback<User, OAuth2StrategyVerifyParams<KeycloakProfile, KeycloakExtraParams>> {
  return async ({ profile }) => {
    const user = await prisma.user.findFirst({
      where: { keycloakId: keycloakInstanceName + ":" + profile.id },
    });

    if (user !== null) {
      if (user.firstName !== profile.name.givenName || user.lastName !== profile.name.familyName) {
        await updateUserData(user, profile);
      }
      return user;
    }

    const createdUser = await createNewUser(profile, keycloakInstanceName);
    if (createdUser !== null) {
      return createdUser;
    }

    throw Error("Could not login and/or register");
  };
}

async function createNewUser(profile: KeycloakProfile, idScope: string): Promise<User> {
  const isUsernameAvailable = async (username: string) =>
    (await prisma.user.findFirst({ where: { username } })) === null;

  let username = profile.displayName;
  let suffix = 0;
  while (!(await isUsernameAvailable(username))) {
    username = profile.displayName + suffix;
    suffix++;
  }

  return {
    id: "",
    keycloakId: idScope + ":" + profile.id,
    firstName: profile.name.givenName,
    lastName: profile.name.familyName,
    contactEmailAddress: profile.emails[0].value,
    isContactEmailAddressPublic: false,
    registrationDate: new Date(),
    username,
    image: null,
    description: null,
    phoneNumber: null,
    setupCompleted: false,
  };
}

async function updateUserData(user: User, profile: KeycloakProfile): Promise<void> {
  await prisma.user.update({
    data: {
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
    },
    where: { id: user.id },
  });
}

import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";

import type { User } from "prisma/generated";
import { prisma } from "~/database/db.server";
import { UserWithRoles } from "~/lib/authorization.server";
import { environment } from "~/lib/environment.server";

import type { KeycloakProfile, KeycloakVerifyFunction } from "./keycloakStrategy.server";
import { KeycloakStrategy } from "./keycloakStrategy.server";

export const zamKeycloakStrategyName = "zam-keycloak";
export const devKeycloakStrategyName = "dev-keycloak";
export const fakeLoginOnDevStrategyName = "fake-login";

export const authenticator = new Authenticator<UserWithRoles>();

setupFakeLoginStrategy();
setupZamKeycloakLogin();
setupDevKeycloakLogin();

function setupFakeLoginStrategy() {
  if (environment.auth.DANGER_ENABLE_FAKE_LOGIN_ON_DEV) {
    if (!environment.IS_DEV_MODE) {
      console.warn(
        "WARNING: DANGER_ENABLE_FAKE_LOGIN_ON_DEV should not be set in non-dev mode. Ignoring.",
      );
    } else {
      const requiredPassword = environment.auth.DANGER_FAKE_LOGIN_PASSWORD;
      const fakeLoginStrategy = new FormStrategy(async ({ form }) => {
        const password = form.get("password");
        if (password !== requiredPassword) {
          throw Error("Could not login and/or register");
        }
        const user = await prisma.user.findFirst({
          include: { roles: { select: { title: true } } },
        });
        console.log("Fake logging in:", user);
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
        clientId: environment.auth.ZAM_KEYCLOAK_CLIENT_ID,
        clientSecret: environment.auth.ZAM_KEYCLOAK_CLIENT_SECRET,
        redirectURI: environment.auth.CALLBACK_BASE + "/auth/zam-keycloak",
      },
      handleKeycloakLogin("zamKeycloak"),
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
        clientId: environment.auth.DEV_KEYCLOAK_CLIENT_ID,
        clientSecret: environment.auth.DEV_KEYCLOAK_CLIENT_SECRET,
        redirectURI: environment.auth.CALLBACK_BASE + "/auth/dev-keycloak",
      },
      handleKeycloakLogin("devKeycloak"),
    );
    authenticator.use(devKeycloak, devKeycloakStrategyName);
  }
}

function handleKeycloakLogin(keycloakInstanceName: string): KeycloakVerifyFunction<UserWithRoles> {
  return async ({ profile }) => {
    const user = await prisma.user.findFirst({
      where: { keycloakId: keycloakInstanceName + ":" + profile.id },
      include: { roles: { select: { title: true } } },
    });

    if (user !== null) {
      if (user.firstName !== profile.firstName || user.lastName !== profile.lastName) {
        await updateUserData(user, profile);
      }
      return user;
    }

    return await createTemporaryUser(profile, keycloakInstanceName);
  };
}

async function createTemporaryUser(
  profile: KeycloakProfile,
  idScope: string,
): Promise<UserWithRoles> {
  const isUsernameAvailable = async (username: string) =>
    (await prisma.user.findFirst({ where: { username } })) === null;

  let username = profile.displayName;
  let suffix = 0;
  while (!(await isUsernameAvailable(username))) {
    username = `${profile.displayName}${suffix}`;
    suffix++;
  }

  return {
    id: "",
    keycloakId: idScope + ":" + profile.id,
    firstName: profile.firstName,
    lastName: profile.lastName,
    contactEmailAddress: profile.email,
    isContactEmailAddressPublic: false,
    registrationDate: new Date(),
    username,
    image: null,
    description: null,
    phoneNumber: null,
    setupCompleted: false,
    roles: [],
  };
}

async function updateUserData(user: User, profile: KeycloakProfile): Promise<void> {
  await prisma.user.update({
    data: {
      firstName: profile.firstName,
      lastName: profile.lastName,
    },
    where: { id: user.id },
  });
}

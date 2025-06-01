// import type { VerifyFunction } from "remix-auth";
import { OAuth2Tokens } from "arctic";
import { OAuth2Strategy } from "remix-auth-oauth2";

import { logger } from "~/lib/logging.server";

export interface KeycloakStrategyOptions {
  useSSL?: boolean; // Whether to use SSL for Keycloak server communication.
  domain: string; // Keycloak server domain.
  realm: string; // Keycloak realm.
  clientId: string; // Client ID for the registered application in Keycloak.
  clientSecret: string; // Client Secret for the registered application in Keycloak.
  redirectURI: string; // URL to which Keycloak will redirect the user after authentication.
  scope?: `${`${string} ` | ""}openid profile email${"" | ` ${string}`}`; // Optional scopes for Keycloak authentication. must contain `openid profile email`
}

export interface KeycloakProfile {
  provider: string;
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
}

export type KeycloakVerifyFunction<T> = (response: {
  request: Request; // the request that triggered the authentication flow
  tokens: OAuth2Tokens; // the oauth tokens returned by keycloak
  profile: KeycloakProfile; // the user profile from keycloak's userinfo
}) => T | Promise<T>;

export class KeycloakStrategy<T> extends OAuth2Strategy<T> {
  name = "keycloak"; // Strategy name.

  private userInfoURL: string; // URL to fetch user information from Keycloak.
  public scope: string; // Scopes for Keycloak authentication.

  constructor(options: KeycloakStrategyOptions, verify: KeycloakVerifyFunction<T>) {
    const {
      clientId,
      clientSecret,
      useSSL = true,
      domain,
      realm,
      redirectURI,
      scope = "openid profile email",
    } = options;
    const host = `${useSSL ? "https" : "http"}://${domain}`;

    const oauthOptions = {
      clientId,
      clientSecret,
      authorizationEndpoint: `${host}/realms/${realm}/protocol/openid-connect/auth`,
      tokenEndpoint: `${host}/realms/${realm}/protocol/openid-connect/token`,
      redirectURI,
    };
    const augmentedVerifyFunction = async ({ request, tokens }: OAuth2Strategy.VerifyOptions) => {
      return verify({ request, tokens, profile: await this.userProfile(tokens.accessToken()) });
    };

    super(oauthOptions, augmentedVerifyFunction);

    // Set Keycloak-specific URLs and scope.
    this.userInfoURL = `${host}/realms/${realm}/protocol/openid-connect/userinfo`;
    this.scope = scope;
  }

  /**
   * Overrides parent class method to provide additional authorization parameters specific to Keycloak.
   * @returns URLSearchParams containing the specified scope.
   */
  protected authorizationParams(params: URLSearchParams) {
    params.append("scope", this.scope);
    return params;
  }

  /**
   * Custom method to fetch and parse the user profile from Keycloak.
   * @param accessToken - Access token obtained during the authentication process.
   * @returns Promise resolving to the Keycloak user profile.
   */
  protected async userProfile(accessToken: string): Promise<KeycloakProfile> {
    try {
      const headers = new Headers({ Authorization: `Bearer ${accessToken}` });
      const response = await fetch(this.userInfoURL, { headers });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = await response.json();
      assertIsValidResponse(data);

      return {
        provider: "keycloak",
        id: data.sub,
        displayName: data.name,
        firstName: data.family_name,
        lastName: data.given_name,
        email: data.email,
      };
    } catch (error) {
      logger("login-keycloak").error("Error fetching user profile:", error);
      throw error;
    }
  }
}

type KeycloakUserInfo = {
  sub: string;
  name: string;
  family_name: string;
  given_name: string;
  email: string;
};

function assertIsValidResponse(arg: unknown): asserts arg is KeycloakUserInfo {
  if (typeof arg !== "object" || arg === null) {
    throw Error("Unexpected response from Keycloak");
  }

  if (
    !("sub" in arg) ||
    typeof arg["sub"] !== "string" ||
    !("name" in arg) ||
    typeof arg["name"] !== "string" ||
    !("family_name" in arg) ||
    typeof arg["family_name"] !== "string" ||
    !("given_name" in arg) ||
    typeof arg["given_name"] !== "string" ||
    !("email" in arg) ||
    typeof arg["email"] !== "string"
  ) {
    throw Error("Unexpected response from Keycloak");
  }
}

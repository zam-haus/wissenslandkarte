import invariant from "tiny-invariant";

export const environment = {
  get IS_DEV_MODE() {
    return process.env.NODE_ENV === "development";
  },
  get SESSION_SECRET() {
    return getFromEnvOrThrow("SESSION_SECRET");
  },
  auth: {
    get DANGER_ENABLE_FAKE_LOGIN_ON_DEV() {
      return getFromEnv("DANGER_ENABLE_FAKE_LOGIN_ON_DEV") === "true";
    },
    get DANGER_FAKE_LOGIN_PASSWORD() {
      return getFromEnvOrThrow("DANGER_FAKE_LOGIN_PASSWORD");
    },
    get ENABLE_ZAM_KEYCLOACK() {
      return getFromEnv("AUTH_ENABLE_ZAM_KEYCLOAK", Boolean);
    },
    get ZAM_KEYCLOAK_DOMAIN() {
      return getFromEnvOrThrow("AUTH_ZAM_KEYCLOAK_DOMAIN");
    },
    get ZAM_KEYCLOAK_REALM() {
      return getFromEnvOrThrow("AUTH_ZAM_KEYCLOAK_REALM");
    },
    get ZAM_KEYCLOAK_CLIENT_ID() {
      return getFromEnvOrThrow("AUTH_ZAM_KEYCLOAK_CLIENT_ID");
    },
    get ZAM_KEYCLOAK_CLIENT_SECRET() {
      return getFromEnvOrThrow("AUTH_ZAM_KEYCLOAK_CLIENT_SECRET");
    },
    get CALLBACK_BASE() {
      return getFromEnvOrThrow("AUTH_CALLBACK_BASE");
    },
  },
  s3: {
    get BUCKET() {
      return getFromEnvOrThrow("S3_STORAGE_BUCKET");
    },
    get ACCESS_KEY() {
      return getFromEnvOrThrow("S3_STORAGE_ACCESS_KEY");
    },
    get SECRET_KEY() {
      return getFromEnvOrThrow("S3_STORAGE_SECRET_KEY");
    },
    get REGION() {
      return getFromEnvOrThrow("S3_STORAGE_REGION");
    },
    get ENDPOINT() {
      return getFromEnvOrThrow("S3_STORAGE_ENDPOINT");
    },
    get IS_MINIO() {
      return getFromEnv("S3_STORAGE_IS_MINIO", Boolean);
    },
    get OVERRIDE_HOST() {
      return getFromEnv("OVERRIDE_HOST");
    },
  },
};

type Mapper<T> = (value: string) => T;
function getFromEnvOrThrow(key: string): string;
function getFromEnvOrThrow<T>(key: string, mapper: Mapper<T>): T;
function getFromEnvOrThrow<T>(key: string, mapper?: Mapper<T>): string | T {
  const value = process.env[key];
  invariant(value, `Missing authentication config environent variable ${key}`);
  if (mapper === undefined) {
    return value;
  }
  return mapper(value);
}

type MaybeMapper<T> = (value?: string) => T | undefined;
function getFromEnv(key: string): string;
function getFromEnv<T>(key: string, mapper: MaybeMapper<T>): T | undefined;
function getFromEnv<T>(key: string, mapper?: MaybeMapper<T>): string | T | undefined {
  if (mapper === undefined) {
    return process.env[key];
  }
  return mapper(process.env[key]);
}

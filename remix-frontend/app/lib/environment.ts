import invariant from "tiny-invariant";

type Mapper<T> = (value: string) => T;
export function getFromEnvOrThrow(key: string): string;
export function getFromEnvOrThrow<T>(key: string, mapper: Mapper<T>): T;
export function getFromEnvOrThrow<T>(key: string, mapper?: Mapper<T>): string | T {
  const value = process.env[key];
  invariant(value, `Missing authentication config environent variable ${key}`);
  if (mapper === undefined) {
    return value;
  }
  return mapper(value);
}

type MaybeMapper<T> = (value?: string) => T | undefined;
export function getFromEnv(key: string): string;
export function getFromEnv<T>(key: string, mapper: MaybeMapper<T>): T | undefined;
export function getFromEnv<T>(key: string, mapper?: MaybeMapper<T>): string | T | undefined {
  if (mapper === undefined) {
    return process.env[key];
  }
  return mapper(process.env[key]);
}

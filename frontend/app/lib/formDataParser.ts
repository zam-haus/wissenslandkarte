export function getTrimmedStringsDefaultEmpty<K extends string>(
  formData: FormData,
  ...keys: K[]
): { [key in K]: string } {
  const result = {} as { [key in K]: string };
  for (const key of keys) {
    const value = formData.get(key);
    if (value instanceof File) {
      continue;
    }
    result[key] = (value ?? "").trim();
  }
  return result;
}

export function getStringsDefaultUndefined<K extends string>(
  formData: FormData,
  ...keys: K[]
): { [key in K]: string | undefined } {
  const result = {} as { [key in K]: string | undefined };
  for (const key of keys) {
    const value = formData.get(key);
    result[key] =
      value === null || typeof value !== "string" || value.length === 0 ? undefined : value;
  }
  return result;
}

export function getStringArray<K extends string>(
  formData: FormData,
  ...keys: K[]
): { [key in K]: string[] } {
  const result = {} as { [key in K]: string[] };
  for (const key of keys) {
    result[key] = formData.getAll(key).filter((value) => typeof value === "string");
  }
  return result;
}

export function getBooleanDefaultFalse<K extends string>(
  formData: FormData,
  ...keys: K[]
): { [key in K]: boolean } {
  const result = {} as { [key in K]: boolean };
  for (const key of keys) {
    result[key] = Boolean(formData.get(key) ?? false);
  }
  return result;
}

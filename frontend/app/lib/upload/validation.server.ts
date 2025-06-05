import { randomUUID } from "crypto";

import { baseLogger } from "../logging.server";

const logger = baseLogger.withTag("upload-validation");

const allowedSuffixes = [
  "apng",
  "avif",
  "gif",
  "jpg",
  "jpeg",
  "jfif",
  "pjpeg",
  "pjp",
  "png",
  "svg",
  "webp",
];

export const ValidationResult = {
  Invalid: "invalid",
  Valid: "valid",
} as const;

export type Validity = (typeof ValidationResult)[keyof typeof ValidationResult];

export function validateSuffix(suffix: string | undefined): Validity {
  return validateFilename(suffix);
}

export function validateFilename(filename: string | undefined): Validity {
  if (!allowedSuffixes.some((suffix) => filename?.toLowerCase().endsWith(suffix))) {
    logger.warn("%s doesn't match suffix list", filename ?? "no-filename");
    return ValidationResult.Invalid;
  }
  return ValidationResult.Valid;
}

export function validateContentType(contentType: string | undefined): Validity {
  if (!contentType?.startsWith("image/")) {
    logger.warn("%s doesn't match content type starting with image/", contentType);
    return ValidationResult.Invalid;
  }
  return ValidationResult.Valid;
}

export function createValidFilename(filename: string | undefined) {
  const uuid = randomUUID();
  if (filename === undefined) {
    return uuid;
  }

  const elements = filename.toLowerCase().split(".");
  const [suffix, ...__] = elements.reverse();
  if (!allowedSuffixes.includes(suffix)) {
    return uuid;
  }
  return `${uuid}.${suffix}`;
}

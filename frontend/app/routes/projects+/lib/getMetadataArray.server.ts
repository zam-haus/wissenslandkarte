import {
  type ShallowMetadataValue,
  getAllMetadataTypes,
} from "~/database/repositories/projectMetadata.server";

export type MetadataValidationResult = {
  valid: boolean;
  errors: MetadataValidationError[];
};

type MetadataValidationError = {
  metadataTypeId: string;
  error: string;
};

export function validateMetadataValue(value: string, dataType: string): boolean {
  if (!value.trim()) return true; // Empty values are allowed

  switch (dataType) {
    case "int":
      return /^\d+$/.test(value);
    case "float":
      return /^\d+(\.\d+)?$/.test(value);
    case "boolean":
      return value === "true" || value === "false";
    case "text":
      return true;
    default:
      return true;
  }
}

export async function validateMetadataArray(
  metadata: ShallowMetadataValue[],
): Promise<MetadataValidationResult> {
  const errors: MetadataValidationError[] = [];

  const availableMetadataTypes = await getAllMetadataTypes();
  const metadataTypeMap = new Map(availableMetadataTypes.map((type) => [type.id, type]));

  for (const item of metadata) {
    const metadataType = metadataTypeMap.get(item.metadataTypeId);

    if (metadataType === undefined) {
      errors.push({
        metadataTypeId: item.metadataTypeId,
        error: `Unknown metadata type: ${item.metadataTypeId}`,
      });
      continue;
    }

    if (!validateMetadataValue(item.value, metadataType.dataType)) {
      errors.push({
        metadataTypeId: item.metadataTypeId,
        error: `Invalid value for type ${metadataType.dataType}: ${item.value}`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function getMetadataArray(formData: FormData): ShallowMetadataValue[] {
  const metadata: ShallowMetadataValue[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("metadata[") || !key.endsWith("]") || typeof value !== "string") {
      continue;
    }
    const metadataTypeId = key.slice(9, -1);
    if (value.trim() === "") {
      continue;
    }

    metadata.push({
      metadataTypeId,
      value: value.trim(),
    });
  }

  return metadata;
}

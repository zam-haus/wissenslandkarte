import {
  type MemoryUploadHandlerOptions,
  unstable_createMemoryUploadHandler,
  type UploadHandler,
  type UploadHandlerPart,
} from "@remix-run/node";

export type FieldIgnoringMemoryUploadHandlerOptions = MemoryUploadHandlerOptions & {
  ignoreFields: string[];
};

export function createFieldIgnoringMemoryUploadHandler(
  args: FieldIgnoringMemoryUploadHandlerOptions
): UploadHandler {
  const { ignoreFields, ...wrappedArgs } = args;
  const wrappedUploadHandler = unstable_createMemoryUploadHandler(wrappedArgs);

  return async (part: UploadHandlerPart) => {
    if (ignoreFields.includes(part.name)) {
      console.log(`Ignoring field ${part.name} in memory upload handler`);
      return undefined;
    }
    return await wrappedUploadHandler(part);
  };
}

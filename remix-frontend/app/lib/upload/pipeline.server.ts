import { unstable_composeUploadHandlers, unstable_parseMultipartFormData } from "@remix-run/node";

import { createFieldIgnoringMemoryUploadHandler } from "./handler-memory.server";
import { createS3UploadHandler } from "./handler-s3.server";

export function parseMultipartFormDataUploadFilesToS3(
  request: Request,
  fieldsToUploadToS3: string[]
) {
  return unstable_parseMultipartFormData(
    request,
    unstable_composeUploadHandlers(
      createS3UploadHandler(fieldsToUploadToS3),
      createFieldIgnoringMemoryUploadHandler({ ignoreFields: fieldsToUploadToS3 })
    )
  );
}

import { unstable_composeUploadHandlers, unstable_parseMultipartFormData } from "@remix-run/node";

import { getLoggedInUser } from "../authorization.server";

import { createFieldIgnoringMemoryUploadHandler } from "./handler-memory.server";
import { createS3UploadHandler } from "./handler-s3.server";

export async function parseMultipartFormDataUploadFilesToS3(
  request: Request,
  fieldsToUploadToS3: string[],
  valueToReturnIfUploadFails: string | undefined = undefined,
) {
  const uploader = await getLoggedInUser(request);
  if (uploader === null) {
    throw new Error("Someone tried uploading a file but was not logged in");
  }
  return unstable_parseMultipartFormData(
    request,
    unstable_composeUploadHandlers(
      createS3UploadHandler(fieldsToUploadToS3, uploader, valueToReturnIfUploadFails),
      createFieldIgnoringMemoryUploadHandler({ ignoreFields: fieldsToUploadToS3 }),
    ),
  );
}

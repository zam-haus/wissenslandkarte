import { Attachment } from "prisma/generated";
import { AttachmentType } from "prisma/initialization/data/fake-data-generators";

export { attachmentTypes, isAttachmentType } from "prisma/initialization/data/fake-data-generators";
export type { AttachmentType } from "prisma/initialization/data/fake-data-generators";

export type LinkAttachment = TypedAttachment<"link">;
export function isLinkAttachment<T extends Pick<Attachment, "type">>(
  attachment: T,
): attachment is T & Pick<LinkAttachment, "type"> {
  return isTypedAttachment(attachment, "link");
}

export type ImageAttachment = TypedAttachment<"image">;
export function isImageAttachment<T extends Pick<Attachment, "type">>(
  attachment: T,
): attachment is T & Pick<ImageAttachment, "type"> {
  return isTypedAttachment(attachment, "image");
}

export type FileAttachment = TypedAttachment<"file">;
export function isFileAttachment<T extends Pick<Attachment, "type">>(
  attachment: T,
): attachment is T & Pick<FileAttachment, "type"> {
  return isTypedAttachment(attachment, "file");
}

type TypedAttachment<T extends AttachmentType> = Attachment & {
  type: T;
};

function isTypedAttachment<U extends Pick<Attachment, "type">, T extends AttachmentType>(
  attachment: U,
  type: T,
): attachment is U & Pick<TypedAttachment<T>, "type"> {
  return attachment.type === type;
}

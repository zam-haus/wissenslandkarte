import type { User } from "@prisma/client";
import type { TFunction } from "i18next";

import placeHolderImage from "./user-image-placeholder.png";
import styles from "./user-image.module.css";

type UserImageProps = Pick<User, "username" | "image"> & {
  t: TFunction<"users", unknown>;
  className?: string;
};
export function UserImage({ username, image, t, className }: UserImageProps) {
  return (
    <img
      src={image ?? placeHolderImage}
      alt={t("profile-picture-alt-text", { username })}
      className={`${styles.userImage} ${className}`}
    />
  );
}

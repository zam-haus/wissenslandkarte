import type { User } from "@prisma/client";
import { useTranslation } from "react-i18next";

import placeHolderImage from "./user-image-placeholder.png";
import styles from "./user-image.module.css";

type UserImageProps = Pick<User, "username" | "image"> & {
  className?: string;
};
export function UserImage({ username, image, className }: UserImageProps) {
  const { t } = useTranslation("common");

  return (
    <img
      src={image ?? placeHolderImage}
      alt={t("profile-picture-alt-text", { username })}
      className={`${styles.userImage} ${className}`}
    />
  );
}

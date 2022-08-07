import type { ProjectDTO } from './project';

type URL = string;

export interface UserDTO {
  id: number;
  username: string;
  description: string;
  tags: string[];
  image: URL;
  projectsShortInfo: Pick<ProjectDTO, 'id' | 'latestModificationDate' | 'title' | 'mainPhoto'>[];

  registrationDate: Date;
  contactEmailAddress?: string;
}

export type UserId = UserDTO['id'];

export interface CurrentUserDTO extends UserDTO {
  id: UserId;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  contactEmailAddress: string;
  isContactEmailAddressPublic: boolean;
}

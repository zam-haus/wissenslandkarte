import { UserDTO } from './user';

export const attachmentTypes = ['image', 'file', 'link'] as const;
export type AttachmentType = typeof attachmentTypes[number];

export type ShortProjectListEntryDTO = Pick<ProjectDTO, 'id' | 'title' | 'mainPhoto' | 'creationDate' | 'latestModificationDate'>

export interface ProjectDTO {
  id: number;
  title: string;
  owners: UserDTO[];
  members: UserDTO[]
  tags: string[];
  mainPhoto: string;
  attachments: AttachmentDTO[];
  creationDate: Date;
  latestModificationDate: Date;
}

export interface AttachmentDTO {
  type: AttachmentType;
  url: string;
  creationDate: Date;
}
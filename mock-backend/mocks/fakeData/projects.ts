import { faker } from '@faker-js/faker';

import { UserDTO } from '../models/user';
import { attachmentTypes, ProjectDTO, AttachmentDTO, ShortProjectListEntryDTO } from '../models/project';
import { USERS } from './users';

export const PROJECTS = Array.from(Array(20), (value, key) => makeRandomFakeProjectDto(key, USERS, []));

export function projectToProjectListEntry(project: ProjectDTO): ShortProjectListEntryDTO {
  const { id, title, mainPhoto, creationDate, latestModificationDate } = project;
  return { id, title, mainPhoto, creationDate, latestModificationDate };
}

export function makeRandomFakeProjectDto(id: number, users: UserDTO[], tags: string[]): ProjectDTO {
  const owners = faker.random.arrayElements(users, faker.datatype.number({ min: 1, max: 2 }));
  let members: UserDTO[] = [];
  while (members.length === 0) {
    members = faker.random.arrayElements(users, faker.datatype.number(4));
    members = members.filter((member) => !owners.includes(member));
  }

  const latestModificationDate = faker.date.recent();

  return {
    id,
    title: `${faker.company.bsBuzz()} ${faker.company.bsNoun()}`,
    owners,
    members,
    tags: faker.random.arrayElements(tags, faker.datatype.number(10)),
    mainPhoto: faker.image.technics(),
    attachments: Array.from(Array((faker.datatype.number({ min: 0, max: 3 }))), () => makeRandomFakeAttachmentDto()),
    creationDate: faker.date.recent(5, latestModificationDate),
    latestModificationDate,
  };
}

function makeRandomFakeAttachmentDto(): AttachmentDTO {
  const type = faker.random.arrayElement(attachmentTypes);
  const creationDate = faker.date.recent();

  if (type === 'image') {
    return { type, creationDate, url: faker.image.technics() };
  } else {
    return { type, creationDate, url: faker.internet.url() };
  }
}
import { faker } from '@faker-js/faker';

import {
  AttachmentDTO, attachmentTypes, ProjectDTO, ShortProjectListEntryDTO,
} from '../models/project';
import { UserDTO } from '../models/user';

export function projectToProjectListEntry(project: ProjectDTO): ShortProjectListEntryDTO {
  const {
    id, title, description, mainPhoto, creationDate, latestModificationDate,
  } = project;
  return {
    id, title, description, mainPhoto, creationDate, latestModificationDate,
  };
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
    description: faker.lorem.paragraphs(2),
    owners,
    members,
    tags: faker.random.arrayElements(tags, faker.datatype.number(10)),
    mainPhoto: faker.image.technics(),
    attachments: Array.from(
      Array((faker.datatype.number({ min: 0, max: 3 }))),
      () => makeRandomFakeAttachmentDto(),
    ),
    creationDate: faker.date.recent(5, latestModificationDate),
    needsProjectArea: false,
    latestModificationDate,
  };
}

function makeRandomFakeAttachmentDto(): AttachmentDTO {
  const type = faker.random.arrayElement(attachmentTypes);
  const creationDate = faker.date.recent();

  if (type === 'image') {
    return { type, creationDate, url: faker.image.technics() };
  }
  return { type, creationDate, url: faker.internet.url() };
}

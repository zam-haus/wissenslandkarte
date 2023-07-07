import { Faker } from "@faker-js/faker";
import { Attachment, Project, Tag, User } from "@prisma/client";

export function makeRandomTag(faker: Faker): Omit<Tag, 'id'> {
  return {
    name: faker.company.bsNoun()
  }
}

export function makeRandomUser(faker: Faker): Omit<User, 'id'> {
  faker.setLocale('de');

  const firstName = faker.name.firstName();
  const lastName = faker.name.lastName();

  return {
    firstName,
    lastName,
    username: faker.internet.userName(firstName, lastName),
    description: faker.lorem.paragraphs(2),
    image: faker.internet.avatar(),
    registrationDate: faker.date.past(),
    contactEmailAddress: faker.internet.email(firstName, lastName),
    isContactEmailAddressPublic: faker.datatype.boolean(),
    phoneNumber: faker.phone.number()
  }
}

export function makeRandomFakeProject(faker: Faker): Omit<Project, 'id'> {
  const latestModificationDate = faker.date.recent();

  return {
    title: `${faker.company.bsBuzz()} ${faker.company.bsNoun()}`,
    description: faker.lorem.paragraphs(2),
    mainPhoto: faker.image.technics(640, 480, true),
    creationDate: faker.date.recent(5, latestModificationDate),
    needsProjectArea: faker.datatype.boolean(),
    latestModificationDate,
  };
}

export const attachmentTypes = ['image', 'file', 'link'] as const;
export type AttachmentType = typeof attachmentTypes[number];

export function makeRandomFakeAttachmentDto(faker: Faker): Omit<Attachment, 'id' | 'projectId'> {
  const type = faker.helpers.arrayElement(attachmentTypes);
  const creationDate = faker.date.recent();

  if (type === 'image') {
    return { type, creationDate, url: faker.image.technics(640, 480, true), };
  } else {
    return { type, creationDate, url: faker.internet.url() };
  }
}
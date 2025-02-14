import type { Faker } from "@faker-js/faker";
import type { Attachment, Project, ProjectStep, Tag, User } from "@prisma/client";

export function makeRandomTag(faker: Faker): Omit<Tag, "id"> {
  return {
    name: faker.company.bsNoun(),
  };
}

export function makeRandomUser(faker: Faker): Omit<User, "id"> {
  faker.setLocale("de");

  const completeProfile = faker.datatype.number({ min: 0, max: 100 }) > 20;

  const firstName = completeProfile ? faker.name.firstName() : undefined;
  const lastName = completeProfile ? faker.name.lastName() : undefined;

  return {
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    keycloakId: "fakeData:" + faker.datatype.uuid(),
    username: faker.internet.userName(firstName, lastName),
    description: completeProfile ? faker.lorem.paragraphs(2) : null,
    image: completeProfile ? faker.internet.avatar() : null,
    registrationDate: faker.date.past(),
    contactEmailAddress: completeProfile ? faker.internet.email(firstName, lastName) : null,
    isContactEmailAddressPublic: faker.datatype.boolean(),
    phoneNumber: completeProfile ? faker.phone.number() : null,
    setupCompleted: true,
  };
}

export function makeRandomFakeProject(faker: Faker): Omit<Project, "id"> {
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

export function makeRandomFakeProjectStep(
  faker: Faker,
  project: Pick<Project, "creationDate" | "latestModificationDate">
): Omit<ProjectStep, "id" | "projectId"> {
  const creationDate = faker.date.between(project.creationDate, project.latestModificationDate);
  return {
    creationDate,
    latestModificationDate: creationDate,
    description: faker.lorem.paragraph(),
  };
}

export const attachmentTypes = ["image", "file", "link"] as const;
export type AttachmentType = (typeof attachmentTypes)[number];
export function isAttachmentType(s: string): s is AttachmentType {
  return attachmentTypes.includes(s as any);
}

export function makeRandomFakeAttachmentDto(
  faker: Faker
): Omit<Attachment, "id" | "projectId" | "projectStepId"> {
  const type = faker.helpers.arrayElement(attachmentTypes);
  const creationDate = faker.date.recent();
  const text = faker.company.bs();

  if (type === "image") {
    return {
      type,
      creationDate,
      text,
      url: faker.image.technics(640, 480, true),
    };
  } else {
    return { type, creationDate, text, url: faker.internet.url() };
  }
}

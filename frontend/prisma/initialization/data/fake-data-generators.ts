import { Faker } from "@faker-js/faker";
import type { Attachment, Project, ProjectStep, Tag, User } from "@prisma/client";

export function makeRandomTag(faker: Faker): Omit<Tag, "id"> {
  return {
    name: faker.company.buzzNoun(),
  };
}

export function makeRandomUser(faker: Faker): Omit<User, "id"> {
  const completeProfile = faker.number.int({ min: 0, max: 100 }) > 20;

  const firstName = completeProfile ? faker.person.firstName() : undefined;
  const lastName = completeProfile ? faker.person.lastName() : undefined;

  return {
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    keycloakId: "fakeData:" + faker.string.uuid(),
    username: faker.internet.username({ firstName, lastName }),
    description: completeProfile ? faker.lorem.paragraphs(2) : null,
    image: completeProfile ? faker.image.avatar() : null,
    registrationDate: faker.date.past(),
    contactEmailAddress: completeProfile ? faker.internet.email({ firstName, lastName }) : null,
    isContactEmailAddressPublic: faker.datatype.boolean(),
    phoneNumber: completeProfile ? faker.phone.number() : null,
    setupCompleted: true,
  };
}

export function makeRandomFakeProject(faker: Faker): Omit<Project, "id"> {
  const latestModificationDate = faker.date.recent();

  return {
    title: `${faker.company.buzzVerb()} ${faker.company.buzzNoun()}`,
    description: faker.lorem.paragraphs(2),
    mainImage: faker.image.urlLoremFlickr({ category: "technics", width: 640, height: 480 }),
    creationDate: faker.date.recent({ days: 5, refDate: latestModificationDate }),
    needsProjectArea: faker.datatype.boolean(),
    latestModificationDate,
  };
}

export function makeRandomFakeProjectStep(
  faker: Faker,
  project: Pick<Project, "creationDate" | "latestModificationDate">,
): Omit<ProjectStep, "id" | "projectId"> {
  const creationDate = faker.date.between({
    from: project.creationDate,
    to: project.latestModificationDate,
  });
  return {
    creationDate,
    latestModificationDate: creationDate,
    description: faker.lorem.paragraph(),
  };
}

export const attachmentTypes = ["image", "file", "link"] as const;
export type AttachmentType = (typeof attachmentTypes)[number];
export function isAttachmentType(s: string): s is AttachmentType {
  return (attachmentTypes as readonly string[]).includes(s);
}

export function makeRandomFakeAttachmentDto(
  faker: Faker,
): Omit<Attachment, "id" | "projectId" | "projectStepId"> {
  const type = faker.helpers.arrayElement(attachmentTypes);
  const creationDate = faker.date.recent();
  const text = faker.company.buzzPhrase();

  if (type === "image") {
    return {
      type,
      creationDate,
      text,
      url: faker.image.urlLoremFlickr({ category: "technics", width: 640, height: 480 }),
    };
  } else {
    return { type, creationDate, text, url: faker.internet.url() };
  }
}

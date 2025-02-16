import type { Faker } from "@faker-js/faker";
import { faker } from "@faker-js/faker/locale/de";
import type { Tag, User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import {
  makeRandomFakeAttachmentDto,
  makeRandomFakeProject,
  makeRandomFakeProjectStep,
  makeRandomTag,
  makeRandomUser,
} from "./fake-data-generators";
import { rebuildSearchIndex } from "./rebuild-search-index";

const prisma = new PrismaClient();

const onlyIdsFromModels = ({ id }: { id: string }) => ({ id });

async function seed() {
  console.log("Purging existing data");

  await prisma.user.deleteMany().catch(() => {
    console.error("Could not remove pre-existing users!");
  });
  await prisma.tag.deleteMany().catch(() => {
    console.error("Could not remove pre-existing tags!");
  });
  await prisma.project.deleteMany().catch(() => {
    console.error("Could not remove pre-existing projects!");
  });
  await prisma.projectStep.deleteMany().catch(() => {
    console.error("Could not remove pre-existing project steps!");
  });
  await prisma.attachment.deleteMany().catch(() => {
    console.error("Could not remove pre-existing attachments!");
  });

  faker.seed(42);

  console.log("🌱 Seeding tags");
  await seedTags(400);
  const allTags = await prisma.tag.findMany();

  console.log("🌱🌱 Seeding users");
  await seedUsers(500, faker, allTags);
  const allUsers = await prisma.user.findMany();

  console.log("🌱🌱🌱 Seeding projects");
  await seedProjects(800, faker, allTags, allUsers);

  console.log(`🌱🌱🌱🌱 Database has been seeded.`);
}

async function seedTags(count: number) {
  while (count-- > 0) {
    let data = makeRandomTag(faker);
    if ((await prisma.tag.findFirst({ where: data })) !== null) {
      continue;
    }

    await prisma.tag.create({ data });
  }
}

async function seedUsers(count: number, faker: Faker, allTags: Tag[]) {
  while (count-- > 0) {
    const data = makeRandomUser(faker);
    const tags = faker.helpers.arrayElements(allTags, faker.datatype.number({ min: 0, max: 8 }));

    await prisma.user.create({
      data: {
        ...data,
        tags: {
          connect: tags.map(onlyIdsFromModels),
        },
      },
    });
  }
}

async function seedProjects(count: number, faker: Faker, allTags: Tag[], allUsers: User[]) {
  while (count-- > 0) {
    const data = makeRandomFakeProject(faker);

    const steps = Array(faker.datatype.number({ min: 0, max: 12 }))
      .fill("")
      .map(() => makeRandomFakeProjectStep(faker, data));

    const tags = faker.helpers.arrayElements(allTags, faker.datatype.number(10));
    const owners = faker.helpers.arrayElements(allUsers, faker.datatype.number({ min: 1, max: 2 }));
    let members: User[] = [];
    while (members.length === 0) {
      members = faker.helpers.arrayElements(allUsers, faker.datatype.number(4));
      members = members.filter((member) => !owners.includes(member));
    }

    await prisma.project.create({
      data: {
        ...data,
        tags: {
          connect: tags.map(onlyIdsFromModels),
        },
        owners: {
          connect: owners.map(onlyIdsFromModels),
        },
        members: {
          connect: members.map(onlyIdsFromModels),
        },
        attachments: {
          create: Array.from(Array(faker.datatype.number({ min: 0, max: 3 })), () =>
            makeRandomFakeAttachmentDto(faker)
          ),
        },
        steps: {
          create: [
            ...steps.map((step) => ({
              ...step,
              attachments: {
                create: Array.from(Array(faker.datatype.number({ min: 0, max: 3 })), () =>
                  makeRandomFakeAttachmentDto(faker)
                ),
              },
            })),
          ],
        },
      },
    });
  }
}

void seed()
  .then(() => rebuildSearchIndex(prisma))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(async () => {
    await prisma.$disconnect();
  });

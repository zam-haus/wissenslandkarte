import { Faker, fakerDE as faker } from "@faker-js/faker";

import type { Tag, User } from "../generated";
import { PrismaClient } from "../generated";

import {
  makeRandomFakeAttachmentDto,
  makeRandomFakeProject,
  makeRandomFakeProjectStep,
  makeRandomTag,
  makeRandomUser,
} from "./data/fake-data-generators.ts";
import { roles as builtInRoles } from "./data/production-data-generators.ts";
import { SeedingOptions } from "./seed.ts";

export async function seedDevData(prisma: PrismaClient, options: SeedingOptions) {
  if (options.seedFakeData) {
    console.log("🚜 Seeding fake data");
    await seedFakeData(prisma);
  }
}

const onlyIdsFromModels = ({ id }: { id: string }) => ({ id });
const randomInt = (...args: Parameters<typeof faker.number.int>) => faker.number.int(...args);

async function seedFakeData(prisma: PrismaClient) {
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
  await seedTags(prisma, 400);
  const allTags = await prisma.tag.findMany();

  console.log("🌱🌱 Seeding users");
  await seedUsers(prisma, 500, faker, allTags);
  const allUsers = await prisma.user.findMany();

  console.log("🌱🌱🌱 Seeding projects");
  await seedProjects(prisma, 800, faker, allTags, allUsers);

  console.log(`🌱🌱🌱🌱 Database has been seeded.`);
}

async function seedTags(prisma: PrismaClient, count: number) {
  while (count-- > 0) {
    const data = makeRandomTag(faker);
    if ((await prisma.tag.findFirst({ where: data })) !== null) {
      continue;
    }

    await prisma.tag.create({ data });
  }
}

async function seedUsers(prisma: PrismaClient, count: number, faker: Faker, allTags: Tag[]) {
  let first = true;
  while (count-- > 0) {
    const data = makeRandomUser(faker);
    const tags = faker.helpers.arrayElements(allTags, randomInt({ min: 0, max: 8 }));

    await prisma.user.create({
      data: {
        ...data,
        tags: {
          connect: tags.map(onlyIdsFromModels),
        },
        roles: {
          connect: first ? builtInRoles.map((title) => ({ title })) : [],
        },
      },
    });
    first = false;
  }
}

async function seedProjects(
  prisma: PrismaClient,
  count: number,
  faker: Faker,
  allTags: Tag[],
  allUsers: User[],
) {
  while (count-- > 0) {
    const data = makeRandomFakeProject(faker);

    const steps = Array(randomInt({ min: 0, max: 12 }))
      .fill("")
      .map(() => makeRandomFakeProjectStep(faker, data));

    const tags = faker.helpers.arrayElements(allTags, randomInt(10));
    const owners = faker.helpers.arrayElements(allUsers, randomInt({ min: 1, max: 2 }));
    let members: User[] = [];
    while (members.length === 0) {
      members = faker.helpers.arrayElements(allUsers, randomInt(4));
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
          create: Array.from(Array(randomInt({ min: 0, max: 3 })), () =>
            makeRandomFakeAttachmentDto(faker),
          ),
        },
        steps: {
          create: [
            ...steps.map((step) => ({
              ...step,
              attachments: {
                create: Array.from(Array(randomInt({ min: 0, max: 3 })), () =>
                  makeRandomFakeAttachmentDto(faker),
                ),
              },
            })),
          ],
        },
      },
    });
  }
}

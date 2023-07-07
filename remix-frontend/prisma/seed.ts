import type { Tag, User, Project, Attachment } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { faker } from '@faker-js/faker/locale/de';
import type { Faker } from "@faker-js/faker";
import { makeRandomFakeAttachmentDto, makeRandomFakeProject, makeRandomTag, makeRandomUser } from "./fake-data-generators";

const prisma = new PrismaClient();

const onlyIdsFromModels = ({ id }: { id: string }) => ({ id })

async function seed() {
  await prisma.user.deleteMany().catch(() => { })
  await prisma.tag.deleteMany().catch(() => { })

  faker.seed(42)

  await seedTags(40)
  const allTags = await prisma.tag.findMany()

  await seedUsers(50, faker, allTags)
  const allUsers = await prisma.user.findMany()

  await seedProjects(120, faker, allTags, allUsers);


  console.log(`Database has been seeded. 🌱`);
}

async function seedTags(count: number) {
  while (count-- > 0) {
    const data = makeRandomTag(faker)
    await prisma.tag.create({ data })
  }
}

async function seedUsers(count: number, faker: Faker, allTags: Tag[]) {
  while (count-- > 0) {
    const data = makeRandomUser(faker)
    const tags = faker.helpers.arrayElements(allTags, faker.datatype.number({ min: 0, max: 8 }))

    await prisma.user.create({
      data: {
        ...data,
        tags: {
          connect: tags.map(onlyIdsFromModels)
        }
      }
    })
  }
}

async function seedProjects(count: number, faker: Faker, allTags: Tag[], allUsers: User[]) {
  while (count-- > 0) {
    const data = makeRandomFakeProject(faker)


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
          connect: tags.map(onlyIdsFromModels)
        },
        owners: {
          connect: owners.map(onlyIdsFromModels)
        },
        members: {
          connect: members.map(onlyIdsFromModels)
        },
        attachments: {
          create:
            Array.from(Array((faker.datatype.number({ min: 0, max: 3 }))), () => makeRandomFakeAttachmentDto(faker))
        }
      }
    })
  }
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



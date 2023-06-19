import type { User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { faker } from '@faker-js/faker/locale/de';
import type { Faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function seed() {
  await prisma.user.deleteMany().catch(() => { })

  faker.seed(42)

  let userCount = 50;
  while (userCount-- > 0) {
    const data = makeRandomUser(faker)
    await prisma.user.create({ data })
  }

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



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
    phoneNumber: faker.phone.number(),
  }
}
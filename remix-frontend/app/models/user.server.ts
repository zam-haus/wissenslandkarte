import { prisma } from "~/db.server";

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true
    }
  });
};

export async function getUser(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      description: true,
      image: true,
      registrationDate: true,
    }
  })
}

import { Tag, User } from "@prisma/client";
import { prisma } from "~/db.server";
import { ProjectList } from "./projects.server";

export async function getUserList() {
  return prisma.user.findMany({
    select: {
      id: true,
      username: true
    }
  });
};

type UserOverview =
  Pick<User, "firstName" | "lastName" | "username" | "description" | "image" | "registrationDate"> &
  {
    tags: Tag[],
    ownedProjects: ProjectList[]
    memberProjects: ProjectList[]

  }
export async function getUserOverview(username: User['id']): Promise<UserOverview | null> {
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
      tags: true,
      ownedProjects: { select: { id: true, title: true, latestModificationDate: true, mainPhoto: true } },
      memberProjects: { select: { id: true, title: true, latestModificationDate: true, mainPhoto: true } }
    }
  })
}

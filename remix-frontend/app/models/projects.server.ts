import { Project } from "@prisma/client";
import { prisma } from "~/db.server";

export type ProjectList = Pick<Project, "id" | "title" | "latestModificationDate" | "mainPhoto">

export async function getProjectList(): Promise<ProjectList[]> {
  return prisma.project.findMany({
    select: {
      id: true,
      title: true,
      latestModificationDate: true,
      mainPhoto: true
    }
  })
}

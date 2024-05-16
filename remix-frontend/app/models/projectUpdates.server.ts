import type { ProjectUpdate } from "@prisma/client";

import { prisma } from "~/db.server";

export async function getProjectUpdateDetails(projectUpdateId: ProjectUpdate["id"]) {
  return prisma.projectUpdate.findUnique({
    where: { id: projectUpdateId },
    select: {
      id: true,
      Project: {
        select: {
          id: true,
          owners: { select: { id: true, username: true } },
          members: { select: { id: true, username: true } },
        },
      },
    },
  });
}

export async function deleteProjectUpdate(projectUpdateId: ProjectUpdate["id"]) {
  return prisma.projectUpdate.delete({ where: { id: projectUpdateId } });
}

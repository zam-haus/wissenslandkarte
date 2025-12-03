import { PrismaClient } from "../../prisma/generated";

export const testUsers = [
  {
    id: "test-user-1",
    keycloakId: "test-keycloak-1",
    username: "testuser1",
    firstName: "Test",
    lastName: "User",
    description: "Test user for e2e testing",
    registrationDate: new Date(),
    setupCompleted: true,
  },
  {
    id: "test-user-2",
    keycloakId: "test-keycloak-2",
    username: "testuser2",
    firstName: "Test",
    lastName: "User Two",
    description: "Second test user for e2e testing without completed setup",
    registrationDate: new Date(),
    setupCompleted: false,
  },
];

export const testTags = [
  { id: "test-tag-1", name: "JavaScript" },
  { id: "test-tag-2", name: "React" },
  { id: "test-tag-3", name: "Testing" },
  { id: "test-tag-4", name: "E2E" },
];

export const testProjects = [
  {
    id: "test-project-1",
    title: "Test Project One",
    description: "This is a test project for e2e testing",
    creationDate: new Date(),
    latestModificationDate: new Date(),
    needsProjectArea: false,
  },
  {
    id: "test-project-2",
    title: "Test Project Two",
    description: "Another test project for e2e testing",
    creationDate: new Date(),
    latestModificationDate: new Date(),
    needsProjectArea: true,
  },
];

export const testProjectSteps = [
  {
    id: "test-step-1",
    description: "First step of test project",
    creationDate: new Date(),
    latestModificationDate: new Date(),
    projectId: "test-project-1",
  },
  {
    id: "test-step-2",
    description: "Second step of test project",
    creationDate: new Date(),
    latestModificationDate: new Date(),
    projectId: "test-project-1",
  },
];

export async function seedTestData(prisma: PrismaClient) {
  // Clean existing data
  await prisma.projectStep.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tag.deleteMany();

  // Create test users
  for (const user of testUsers) {
    await prisma.user.create({
      data: user,
    });
  }

  // Create test tags
  for (const tag of testTags) {
    await prisma.tag.create({
      data: tag,
    });
  }

  // Create test projects
  for (const project of testProjects) {
    await prisma.project.create({
      data: project,
    });
  }

  // Create test project steps
  for (const step of testProjectSteps) {
    await prisma.projectStep.create({
      data: step,
    });
  }

  // Link users to tags
  await prisma.user.update({
    where: { id: "test-user-1" },
    data: {
      tags: {
        connect: [{ id: "test-tag-1" }, { id: "test-tag-2" }],
      },
    },
  });

  await prisma.user.update({
    where: { id: "test-user-2" },
    data: {
      tags: {
        connect: [{ id: "test-tag-3" }, { id: "test-tag-4" }],
      },
    },
  });
}

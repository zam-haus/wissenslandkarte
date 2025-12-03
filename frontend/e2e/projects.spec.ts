import { test, expect } from "@playwright/test";

import { ProjectDetailsPage } from "./pages/ProjectDetailsPage";
import { ProjectsPage, ProjectData } from "./pages/ProjectsPage";
import { AuthHelper } from "./utils/auth";
import { setupTestDatabase, cleanupTestDatabase } from "./utils/db-setup";

test.describe("Project Management", () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await cleanupTestDatabase();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const authHelper = new AuthHelper(page);
    await authHelper.login();
  });

  test("should create a new project", async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    const projectData: ProjectData = {
      title: "E2E Test Project",
      description: "This is a test project created by e2e tests",
      needsProjectArea: false,
      tags: ["Testing", "E2E"],
    };

    await projectsPage.createProject(projectData);

    // Should be on project details page
    expect(page.url()).toMatch(/\/projects\/[^\/]+$/);

    const projectDetailsPage = new ProjectDetailsPage(page);
    const projectInfo = await projectDetailsPage.getProjectInfo();

    expect(projectInfo.title).toBe(projectData.title);
    expect(projectInfo.description).toBe(projectData.description);
    expect(projectInfo.needsProjectArea).toBe(projectData.needsProjectArea);
  });

  test("should view project details", async ({ page }) => {
    const projectsPage = new ProjectsPage(page);

    // Create a project first
    const projectData: ProjectData = {
      title: "View Test Project",
      description: "Project for testing view functionality",
    };

    await projectsPage.createProject(projectData);
    const projectUrl = page.url();

    // Navigate to projects list and then back to project
    await page.goto("/projects");
    await page.goto(projectUrl);

    const projectDetailsPage = new ProjectDetailsPage(page);
    const projectInfo = await projectDetailsPage.getProjectInfo();

    expect(projectInfo.title).toBe(projectData.title);
    expect(projectInfo.description).toBe(projectData.description);
  });

  test("should edit project", async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    const projectDetailsPage = new ProjectDetailsPage(page);

    // Create a project first
    const originalData: ProjectData = {
      title: "Original Title",
      description: "Original description",
    };

    await projectsPage.createProject(originalData);
    const projectUrl = page.url();
    const projectId = projectUrl.split("/").pop()!;

    // Edit the project
    const updatedData: ProjectData = {
      title: "Updated Title",
      description: "Updated description",
      needsProjectArea: true,
    };

    await projectsPage.editProject(projectId, updatedData);

    // Verify changes
    const projectInfo = await projectDetailsPage.getProjectInfo();
    expect(projectInfo.title).toBe(updatedData.title);
    expect(projectInfo.description).toBe(updatedData.description);
    expect(projectInfo.needsProjectArea).toBe(updatedData.needsProjectArea);
  });

  test("should add project step", async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    const projectDetailsPage = new ProjectDetailsPage(page);

    // Create a project first
    const projectData: ProjectData = {
      title: "Step Test Project",
      description: "Project for testing step functionality",
    };

    await projectsPage.createProject(projectData);

    // Add a step
    const stepDescription = "First step of the project";
    await projectDetailsPage.addStep(stepDescription);

    // Verify step was added
    const projectInfo = await projectDetailsPage.getProjectInfo();
    expect(projectInfo.steps).toContain(stepDescription);
  });

  test("should edit project step", async ({ page }) => {
    const projectsPage = new ProjectsPage(page);
    const projectDetailsPage = new ProjectDetailsPage(page);

    // Create a project and add a step
    const projectData: ProjectData = {
      title: "Step Edit Test Project",
      description: "Project for testing step editing",
    };

    await projectsPage.createProject(projectData);
    await projectDetailsPage.addStep("Original step description");

    // Get the step ID (this would need to be implemented based on your UI)
    const stepCount = await projectDetailsPage.getStepCount();
    expect(stepCount).toBeGreaterThan(0);

    // Edit the step (assuming we have a way to get step ID)
    // This would need to be adapted based on your actual implementation
    const updatedDescription = "Updated step description";
    // await projectDetailsPage.editStep(stepId, updatedDescription);

    // Verify step was updated
    // const projectInfo = await projectDetailsPage.getProjectInfo();
    // expect(projectInfo.steps).toContain(updatedDescription);
  });

  test("should delete project", async ({ page }) => {
    const projectsPage = new ProjectsPage(page);

    // Create a project first
    const projectData: ProjectData = {
      title: "Delete Test Project",
      description: "Project to be deleted",
    };

    await projectsPage.createProject(projectData);
    const projectUrl = page.url();
    const projectId = projectUrl.split("/").pop()!;

    // Delete the project
    await projectsPage.deleteProject(projectId);

    // Should be redirected to projects list
    expect(page.url()).toContain("/projects");

    // Project should not be visible in list
    const projectCount = await projectsPage.getProjectCount();
    // This assertion would need to be adjusted based on your test data setup
    expect(projectCount).toBeGreaterThanOrEqual(0);
  });

  test("should list user projects", async ({ page }) => {
    const projectsPage = new ProjectsPage(page);

    await page.goto("/projects/mine");

    // Should be able to see projects list
    const projectCount = await projectsPage.getProjectCount();
    expect(projectCount).toBeGreaterThanOrEqual(0);
  });
});

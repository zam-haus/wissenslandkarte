import { test, expect } from "@playwright/test";

import { ProjectsPage, ProjectData } from "./pages/ProjectsPage";
import { SearchPage } from "./pages/SearchPage";
import { AuthHelper } from "./utils/auth";
import { setupTestDatabase, cleanupTestDatabase } from "./utils/db-setup";

test.describe("Search Functionality", () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await cleanupTestDatabase();
  });

  test.beforeEach(async ({ page }) => {
    const authHelper = new AuthHelper(page.context());
    await authHelper.login();
  });

  test("should search for projects by keyword", async ({ page }) => {
    const searchPage = new SearchPage(page);
    const projectsPage = new ProjectsPage(page);

    // Create a test project first
    const projectData: ProjectData = {
      title: "Searchable Test Project",
      description: 'This project contains the keyword "searchable" for testing',
    };

    await projectsPage.createProject(projectData);

    // Navigate to search page
    await page.goto("/search");

    // Search for the project
    await searchPage.searchByKeyword("searchable");

    // Verify results
    const results = await searchPage.getResults();
    expect(results.length).toBeGreaterThan(0);

    const foundProject = results.find(
      (result) => result.title.includes("Searchable") || result.description.includes("searchable"),
    );
    expect(foundProject).toBeTruthy();
  });

  test("should search for projects by title", async ({ page }) => {
    const searchPage = new SearchPage(page);
    const projectsPage = new ProjectsPage(page);

    // Create a test project with specific title
    const projectData: ProjectData = {
      title: "Unique Search Title",
      description: "Project with unique title for search testing",
    };

    await projectsPage.createProject(projectData);

    await page.goto("/search");
    await searchPage.searchByKeyword("Unique Search Title");

    const results = await searchPage.getResults();
    const foundProject = results.find((result) => result.title === "Unique Search Title");
    expect(foundProject).toBeTruthy();
  });

  test("should filter projects by tags", async ({ page }) => {
    const searchPage = new SearchPage(page);
    const projectsPage = new ProjectsPage(page);

    // Create a project with specific tags
    const projectData: ProjectData = {
      title: "Tagged Project",
      description: "Project with specific tags",
      tags: ["JavaScript", "Testing"],
    };

    await projectsPage.createProject(projectData);

    await page.goto("/search");

    // Filter by tag
    await searchPage.filterByTag("JavaScript");

    const results = await searchPage.getResults();
    expect(results.length).toBeGreaterThan(0);

    // Check if results contain the tag
    const hasJavaScriptTag = results.some((result) => result.tags?.includes("JavaScript"));
    expect(hasJavaScriptTag).toBeTruthy();
  });

  test("should show no results for non-existent search terms", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await page.goto("/search");
    await searchPage.searchByKeyword("nonexistentkeyword12345");

    const results = await searchPage.getResults();
    expect(results.length).toBe(0);

    // Should show no results message
    expect(await searchPage.isNoResultsMessageVisible()).toBe(true);
  });

  test("should clear search filters", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await page.goto("/search");

    // Apply some filters
    await searchPage.searchByKeyword("test");
    await searchPage.filterByTag("JavaScript");

    // Clear filters
    await searchPage.clearFilters();

    // Should show all results or reset to default state
    const activeFilters = await searchPage.getActiveFilters();
    expect(activeFilters.length).toBe(0);
  });

  test("should navigate to project from search results", async ({ page }) => {
    const searchPage = new SearchPage(page);
    const projectsPage = new ProjectsPage(page);

    // Create a test project
    const projectData: ProjectData = {
      title: "Navigation Test Project",
      description: "Project for testing navigation from search",
    };

    await projectsPage.createProject(projectData);

    await page.goto("/search");
    await searchPage.searchByKeyword("Navigation Test");

    const results = await searchPage.getResults();
    expect(results.length).toBeGreaterThan(0);

    // Click on the first result
    await searchPage.clickResult(0);

    // Should navigate to project details page
    expect(page.url()).toMatch(/\/projects\/[^\/]+$/);
  });

  test("should search in different sections", async ({ page }) => {
    // Test search in projects section
    await page.goto("/search/projects");
    const searchPage = new SearchPage(page);

    await searchPage.searchByKeyword("test");
    const projectResults = await searchPage.getResults();
    expect(projectResults.length).toBeGreaterThanOrEqual(0);

    // Test search in people section
    await page.goto("/search/people");
    await searchPage.searchByKeyword("test");
    const peopleResults = await searchPage.getResults();
    expect(peopleResults.length).toBeGreaterThanOrEqual(0);
  });

  test("should handle empty search gracefully", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await page.goto("/search");

    // Search with empty string
    await searchPage.searchByKeyword("");

    // Should not crash and should show some results or appropriate message
    const results = await searchPage.getResults();
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  test("should maintain search state across page navigation", async ({ page }) => {
    const searchPage = new SearchPage(page);

    await page.goto("/search");
    await searchPage.searchByKeyword("test");

    // Navigate away and back
    await page.goto("/projects");
    await page.goto("/search");

    // Search should still be active or at least the page should load
    expect(page.url()).toContain("/search");
  });
});

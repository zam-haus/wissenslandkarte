import { Page, Locator } from "@playwright/test";

import { BasePage } from "./BasePage";

export interface ProjectData {
  title: string;
  description: string;
  needsProjectArea?: boolean;
  tags?: string[];
}

export class ProjectsPage extends BasePage {
  private projectList: Locator;
  private searchInput: Locator;
  private searchButton: Locator;
  private newProjectButton: Locator;

  constructor(page: Page) {
    super(page);
    this.projectList = page.locator('[data-testid="project-list"], .project-list');
    this.searchInput = page.locator('input[type="search"], input[name="search"]');
    this.searchButton = page.locator('button[type="submit"]');
    this.newProjectButton = page.locator('a[href="/projects/new"]');
  }

  async createProject(data: ProjectData) {
    await this.newProjectButton.click();
    await this.page.waitForURL("**/projects/new");

    // Fill project form
    await this.page.locator('input[name="title"]').fill(data.title);
    await this.page.locator('textarea[name="description"]').fill(data.description);

    if (data.needsProjectArea) {
      await this.page.locator('input[name="needsProjectArea"]').check();
    }

    // Add tags if provided
    if (data.tags && data.tags.length > 0) {
      for (const tag of data.tags) {
        await this.page.locator('input[placeholder*="tag"], input[name="tags"]').fill(tag);
        await this.page.keyboard.press("Enter");
      }
    }

    // Submit form
    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForURL("**/projects/**");
  }

  async searchProjects(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async getProjectCount(): Promise<number> {
    const projects = await this.projectList
      .locator('.project-item, [data-testid="project-item"]')
      .count();
    return projects;
  }

  async getProjectTitles(): Promise<string[]> {
    const titles = await this.projectList
      .locator('.project-title, [data-testid="project-title"]')
      .allTextContents();
    return titles;
  }

  async viewProject(projectId: string) {
    await this.page.goto(`/projects/${projectId}`);
  }

  async editProject(projectId: string, data: Partial<ProjectData>) {
    await this.page.goto(`/projects/${projectId}/edit`);

    if (data.title) {
      await this.page.locator('input[name="title"]').fill(data.title);
    }
    if (data.description) {
      await this.page.locator('textarea[name="description"]').fill(data.description);
    }
    if (data.needsProjectArea !== undefined) {
      const checkbox = this.page.locator('input[name="needsProjectArea"]');
      if (data.needsProjectArea) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    }

    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForURL("**/projects/**");
  }

  async deleteProject(projectId: string) {
    await this.page.goto(`/projects/${projectId}/delete`);
    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForURL("**/projects");
  }

  async getProjectById(projectId: string) {
    return this.projectList.locator(`[data-project-id="${projectId}"]`);
  }
}

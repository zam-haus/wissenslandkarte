import { Page, Locator } from "@playwright/test";

import { BasePage } from "./BasePage";

export interface ProjectInfo {
  title: string;
  description: string;
  needsProjectArea: boolean;
  steps: string[];
}

export class ProjectDetailsPage extends BasePage {
  projectTitle: Locator;
  projectDescription: Locator;
  projectSteps: Locator;
  addStepButton: Locator;
  editButton: Locator;
  deleteButton: Locator;

  constructor(page: Page) {
    super(page);
    this.projectTitle = page.locator('h1, [data-testid="project-title"]');
    this.projectDescription = page.locator(
      '[data-testid="project-description"], .project-description',
    );
    this.projectSteps = page.locator('[data-testid="project-steps"], .project-steps');
    this.addStepButton = page.locator('a[href*="/step/new"], button[data-testid="add-step"]');
    this.editButton = page.locator('a[href*="/edit"], button[data-testid="edit-project"]');
    this.deleteButton = page.locator('a[href*="/delete"], button[data-testid="delete-project"]');
  }

  async getProjectInfo(): Promise<ProjectInfo> {
    const title = (await this.projectTitle.textContent()) || "";
    const description = (await this.projectDescription.textContent()) || "";
    const needsProjectArea = await this.page
      .locator('[data-testid="needs-project-area"]')
      .isVisible();

    const stepElements = this.projectSteps.locator('[data-testid="step-item"], .step-item');
    const steps = await stepElements.allTextContents();

    return {
      title: title.trim(),
      description: description.trim(),
      needsProjectArea,
      steps: steps.map((step) => step.trim()),
    };
  }

  async addStep(description: string) {
    await this.addStepButton.click();
    await this.page.waitForURL("**/step/new");

    await this.page.locator('textarea[name="description"]').fill(description);
    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForURL("**/projects/**");
  }

  async editStep(stepId: string, description: string) {
    await this.page.goto(`/projects/step/${stepId}/edit`);

    await this.page.locator('textarea[name="description"]').fill(description);
    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForURL("**/projects/**");
  }

  async deleteStep(stepId: string) {
    await this.page.goto(`/projects/step/${stepId}/delete`);
    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForURL("**/projects/**");
  }

  async editProject() {
    await this.editButton.click();
    await this.page.waitForURL("**/edit");
  }

  async deleteProject() {
    await this.deleteButton.click();
    await this.page.waitForURL("**/delete");
    await this.page.locator('button[type="submit"]').click();
    await this.page.waitForURL("**/projects");
  }

  async getStepCount(): Promise<number> {
    return await this.projectSteps.locator('[data-testid="step-item"], .step-item').count();
  }

  getStepById(stepId: string) {
    return this.projectSteps.locator(`[data-step-id="${stepId}"]`);
  }

  async isProjectAreaRequired(): Promise<boolean> {
    return await this.page.locator('[data-testid="needs-project-area"]').isVisible();
  }
}

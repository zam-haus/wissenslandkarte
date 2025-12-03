import { expect, Page } from "@playwright/test";

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Navigation
  async goto(url: string) {
    await this.page.goto(url);
  }

  // Header/Footer interactions
  get navigation() {
    return this.page.locator("#globalScrollContainer nav");
  }

  get mainNavigation() {
    return {
      home: this.navigation.locator('a:has-text("home")'),
      projects: this.navigation.locator('a:has-text("handyman")'),
      search: this.navigation.locator('a:has-text("search")'),
      users: this.navigation.locator('a:has-text("group")'),
      profile: this.navigation.locator('a:has-text("account_box")'),
      login: this.navigation.locator('a:has-text("login")'),
      logout: this.navigation.locator('a:has-text("logout")'),
    };
  }

  get actionBar() {
    return this.page.locator(".center-align nav.group");
  }

  get actionBarButtons() {
    return {
      newProject: this.actionBar.locator('a[href="/projects/new"]'),
      myProjects: this.actionBar.locator('a[href="/projects/mine"]'),
      addStep: this.actionBar.locator('a[href="/projects/step/new"]'),
      search: this.actionBar.locator('a[href="/search"]'),
      profile: this.actionBar.locator('a[href="/users/me"]'),
    };
  }

  async expectBeingLoggedIn(): Promise<void> {
    await expect(this.mainNavigation.logout).toBeVisible();
  }

  async expectBeingLoggedOut(): Promise<void> {
    await expect(this.mainNavigation.login).toBeVisible();
  }

  // Language switching
  async switchLanguage(language: "en" | "de") {
    // Implementation depends on how language switching is implemented
    // This is a placeholder for the actual implementation
    const languageButton = this.page.locator(`[data-language="${language}"]`);
    if (await languageButton.isVisible()) {
      await languageButton.click();
    }
  }

  // Common actions
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}

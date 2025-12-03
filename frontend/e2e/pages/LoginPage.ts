import { Locator, Page } from "@playwright/test";

import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  passwordInput: Locator;
  submitButton: Locator;
  devKeycloakLink: Locator;
  zamKeycloakLink: Locator;

  initialProfileSetupUsernameInput: Locator;
  initialProfileSetupSubmitButton: Locator;
  initialProfileSetupErrorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.devKeycloakLink = page.locator('a[href="/auth/dev-keycloak"]');
    this.zamKeycloakLink = page.locator('a[href="/auth/zam-keycloak"]');
    this.initialProfileSetupUsernameInput = page.locator('input[name="username"]');
    this.initialProfileSetupSubmitButton = page.locator('button[type="submit"]');
    this.initialProfileSetupErrorMessage = page.locator(".error");
  }

  async waitForInitialProfileSetup() {
    await this.page.waitForURL("**/initial-profile-setup");
  }

  async login(password: string) {
    await this.passwordInput.waitFor({ state: "visible" });
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginWithDevKeycloak() {
    await this.devKeycloakLink.click();
  }

  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.locator('.error, .alert, [role="alert"]');
    if (await errorElement.isVisible()) {
      return await errorElement.textContent();
    }
    return null;
  }
}

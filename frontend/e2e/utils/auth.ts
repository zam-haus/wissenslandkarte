import { Page } from "@playwright/test";

import { BasePage } from "e2e/pages/BasePage";
import { FAKE_LOGIN_PASSWORD } from "playwright.config";

import { LoginPage } from "../pages/LoginPage";

export class AuthHelper {
  constructor(private page: Page) {}

  async login(password = FAKE_LOGIN_PASSWORD): Promise<Page> {
    const basePage = new BasePage(this.page);
    await basePage.mainNavigation.login.click();

    const loginPage = new LoginPage(this.page);
    await loginPage.login(password);
  }

  async logout(): Promise<void> {
    const basePage = new BasePage(this.page);
    await basePage.mainNavigation.logout.click();
  }
}

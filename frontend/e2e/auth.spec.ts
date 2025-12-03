import { expect, test } from "@playwright/test";

import { FAKE_LOGIN_PASSWORD } from "playwright.config";

import { BasePage } from "./pages/BasePage";
import { LoginPage } from "./pages/LoginPage";
import { AuthHelper } from "./utils/auth";
import { cleanupTestDatabase, setupTestDatabase } from "./utils/db-setup";

test.describe.only("Authentication", () => {
  const testUsername = "test-username";
  let basePage: BasePage;
  let loginPage: LoginPage;
  let authHelper: AuthHelper;

  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await cleanupTestDatabase();
  });

  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();

    await page.goto("/");
    basePage = new BasePage(page);
    await basePage.expectBeingLoggedOut();

    await basePage.mainNavigation.login.click();

    basePage = new BasePage(page);
    loginPage = new LoginPage(page);
    authHelper = new AuthHelper(page);
  });

  test("should display login form for unauthenticated users", async () => {
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test("should login with fake credentials", async () => {
    await loginPage.login(FAKE_LOGIN_PASSWORD);

    await loginPage.expectBeingLoggedIn();
  });

  test("should logout successfully", async () => {
    await authHelper.login();
    await basePage.expectBeingLoggedIn();

    await basePage.mainNavigation.logout.click();
    await basePage.expectBeingLoggedOut();
  });

  test("should redirect to profile setup for new users", async () => {
    await authHelper.login("create-temp-user");

    await loginPage.waitForInitialProfileSetup();
  });

  test("should set the username in the profile setup for new users", async ({ page }) => {
    await authHelper.login("create-temp-user");

    await loginPage.waitForInitialProfileSetup();

    await loginPage.initialProfileSetupUsernameInput.fill(testUsername);

    await loginPage.initialProfileSetupSubmitButton.click();

    await page.waitForURL(`**/users/${testUsername}/edit`);
  });

  test("should not allow to set used usernames in the profile setup for new users", async () => {
    await authHelper.login("create-temp-user");

    await loginPage.waitForInitialProfileSetup();

    await loginPage.initialProfileSetupUsernameInput.fill(testUsername);

    await loginPage.initialProfileSetupSubmitButton.click();

    await expect(loginPage.initialProfileSetupErrorMessage).toHaveText(
      "This username is already taken",
    );
  });

  test("should maintain session across page navigations", async ({ page }) => {
    await authHelper.login();

    // Navigate to different pages
    await Promise.all([page.waitForURL("**/projects"), basePage.mainNavigation.projects.click()]);
    await basePage.expectBeingLoggedIn();

    await Promise.all([page.waitForURL("**/search/*"), basePage.mainNavigation.search.click()]);
    await basePage.expectBeingLoggedIn();

    await Promise.all([page.waitForURL("**/users"), basePage.mainNavigation.users.click()]);
    await basePage.expectBeingLoggedIn();
  });
});

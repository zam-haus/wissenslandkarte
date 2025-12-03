import { test, expect } from "@playwright/test";

import { FAKE_LOGIN_PASSWORD } from "playwright.config";

import { BasePage } from "./pages/BasePage";
import { LoginPage } from "./pages/LoginPage";
import { AuthHelper } from "./utils/auth";
import { setupTestDatabase, cleanupTestDatabase } from "./utils/db-setup";

test.describe.only("Authentication", () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await cleanupTestDatabase();
  });

  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();

    await page.goto("/");
    const basePage = new BasePage(page);
    await basePage.expectBeingLoggedOut();

    await basePage.mainNavigation.login.click();
  });

  test("should display login form for unauthenticated users", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test("should login with fake credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(FAKE_LOGIN_PASSWORD);

    await loginPage.expectBeingLoggedIn();
  });

  test("should handle invalid login credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login("wrong-password");

    // Should show error message
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
  });

  test("should logout successfully", async ({ page }) => {
    const authHelper = new AuthHelper(page);
    const basePage = new BasePage(page);

    await authHelper.login();
    await basePage.expectBeingLoggedIn();

    await basePage.mainNavigation.logout.click();
    await basePage.expectBeingLoggedOut();
  });

  test.only("should redirect to profile setup for new users", async ({ page }) => {
    // This test would need a user that hasn't completed setup
    // For now, we'll test the basic flow
    const authHelper = new AuthHelper(page);

    await authHelper.login(FAKE_LOGIN_PASSWORD + "-skip1");

    await page.waitForURL("**/initial-profile-setup");
  });

  test("should maintain session across page navigations", async ({ page }) => {
    const authHelper = new AuthHelper(page);
    const basePage = new BasePage(page);

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

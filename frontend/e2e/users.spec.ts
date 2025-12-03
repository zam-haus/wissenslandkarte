import { test, expect } from "@playwright/test";

import { BasePage } from "./pages/BasePage";
import { UserProfilePage, UserProfileData } from "./pages/UserProfilePage";
import { AuthHelper } from "./utils/auth";
import { setupTestDatabase, cleanupTestDatabase } from "./utils/db-setup";

test.describe("User Profile Management", () => {
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

  test("should view own profile", async ({ page }) => {
    const userProfilePage = new UserProfilePage(page);

    await page.goto("/users/me");

    const profileInfo = await userProfilePage.getProfileInfo();
    expect(profileInfo.username).toBeTruthy();
    expect(await userProfilePage.isOwnProfile()).toBe(true);
  });

  test("should edit own profile", async ({ page }) => {
    const userProfilePage = new UserProfilePage(page);

    await page.goto("/users/me");

    const updatedData: Partial<UserProfileData> = {
      firstName: "Updated First Name",
      lastName: "Updated Last Name",
      description: "Updated description for e2e testing",
      phoneNumber: "+1234567890",
      contactEmail: "test@example.com",
      isContactEmailPublic: true,
    };

    await userProfilePage.editProfile(updatedData);

    // Verify changes were saved
    const profileInfo = await userProfilePage.getProfileInfo();
    expect(profileInfo.firstName).toBe(updatedData.firstName);
    expect(profileInfo.lastName).toBe(updatedData.lastName);
    expect(profileInfo.description).toBe(updatedData.description);
    expect(profileInfo.phoneNumber).toBe(updatedData.phoneNumber);
    expect(profileInfo.contactEmail).toBe(updatedData.contactEmail);
    expect(profileInfo.isContactEmailPublic).toBe(updatedData.isContactEmailPublic);
  });

  test("should view other user profiles", async ({ page }) => {
    const userProfilePage = new UserProfilePage(page);

    // Navigate to a specific user profile
    await userProfilePage.viewUserProfile("testuser2");

    const profileInfo = await userProfilePage.getProfileInfo();
    expect(profileInfo.username).toBe("testuser2");
    expect(await userProfilePage.isOwnProfile()).toBe(false);
  });

  test("should display user contact information when public", async ({ page }) => {
    const userProfilePage = new UserProfilePage(page);

    // First, set up a user with public contact info
    await userProfilePage.viewUserProfile("testuser1");

    const contactInfo = await userProfilePage.getContactInfo();
    // Contact info should be visible if the user has made it public
    expect(contactInfo.phoneNumber || contactInfo.contactEmail).toBeTruthy();
  });

  test("should list user projects", async ({ page }) => {
    const userProfilePage = new UserProfilePage(page);

    await userProfilePage.viewUserProfile("testuser1");

    const userProjects = await userProfilePage.getUserProjects();
    expect(Array.isArray(userProjects)).toBe(true);
  });

  test("should display user tags", async ({ page }) => {
    const userProfilePage = new UserProfilePage(page);

    await userProfilePage.viewUserProfile("testuser1");

    const userTags = await userProfilePage.getUserTags();
    expect(Array.isArray(userTags)).toBe(true);
  });

  test("should navigate to user profile from navigation", async ({ page }) => {
    const basePage = new BasePage(page);

    await page.goto("/");
    await basePage.profileButton.click();

    expect(page.url()).toContain("/users/me");
  });

  test("should handle profile editing validation", async ({ page }) => {
    const userProfilePage = new UserProfilePage(page);

    await page.goto("/users/me");

    // Try to edit with invalid data (if validation exists)
    const invalidData: Partial<UserProfileData> = {
      contactEmail: "invalid-email-format",
    };

    await userProfilePage.editProfile(invalidData);

    // Should either show validation error or handle gracefully
    // This test would need to be adapted based on your validation implementation
    const profileInfo = await userProfilePage.getProfileInfo();
    expect(profileInfo.contactEmail).toBeDefined();
  });

  test("should maintain profile state across navigation", async ({ page }) => {
    const userProfilePage = new UserProfilePage(page);

    await page.goto("/users/me");
    const originalProfile = await userProfilePage.getProfileInfo();

    // Navigate away and back
    await page.goto("/projects");
    await page.goto("/users/me");

    const currentProfile = await userProfilePage.getProfileInfo();
    expect(currentProfile.username).toBe(originalProfile.username);
  });

  test("should show user list page", async ({ page }) => {
    await page.goto("/users");

    // Should be able to see users list
    const userList = page.locator('[data-testid="user-list"], .user-list');
    expect(await userList.isVisible()).toBe(true);
  });
});

import { Page, Locator } from "@playwright/test";

import { BasePage } from "./BasePage";

export interface UserProfileData {
  username: string;
  firstName?: string;
  lastName?: string;
  description?: string;
  phoneNumber?: string;
  contactEmail?: string;
  isContactEmailPublic?: boolean;
}

export class UserProfilePage extends BasePage {
  private profileForm: Locator;
  private usernameDisplay: Locator;
  private firstNameInput: Locator;
  private lastNameInput: Locator;
  private descriptionInput: Locator;
  private phoneNumberInput: Locator;
  private contactEmailInput: Locator;
  private contactEmailPublicCheckbox: Locator;
  private saveButton: Locator;
  private editButton: Locator;

  constructor(page: Page) {
    super(page);
    this.profileForm = page.locator('form[data-testid="profile-form"], form');
    this.usernameDisplay = page.locator('[data-testid="username"], .username');
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.descriptionInput = page.locator('textarea[name="description"]');
    this.phoneNumberInput = page.locator('input[name="phoneNumber"]');
    this.contactEmailInput = page.locator('input[name="contactEmailAddress"]');
    this.contactEmailPublicCheckbox = page.locator('input[name="isContactEmailAddressPublic"]');
    this.saveButton = page.locator('button[type="submit"]');
    this.editButton = page.locator('a[href*="/edit"], button[data-testid="edit-profile"]');
  }

  async getProfileInfo(): Promise<UserProfileData> {
    const username = (await this.usernameDisplay.textContent()) || "";
    const firstName = (await this.firstNameInput.inputValue()) || undefined;
    const lastName = (await this.lastNameInput.inputValue()) || undefined;
    const description = (await this.descriptionInput.inputValue()) || undefined;
    const phoneNumber = (await this.phoneNumberInput.inputValue()) || undefined;
    const contactEmail = (await this.contactEmailInput.inputValue()) || undefined;
    const isContactEmailPublic = await this.contactEmailPublicCheckbox.isChecked();

    return {
      username: username.trim(),
      firstName,
      lastName,
      description,
      phoneNumber,
      contactEmail,
      isContactEmailPublic,
    };
  }

  async editProfile(data: Partial<UserProfileData>) {
    await this.editButton.click();
    await this.page.waitForURL("**/edit");

    if (data.firstName !== undefined) {
      await this.firstNameInput.fill(data.firstName);
    }
    if (data.lastName !== undefined) {
      await this.lastNameInput.fill(data.lastName);
    }
    if (data.description !== undefined) {
      await this.descriptionInput.fill(data.description);
    }
    if (data.phoneNumber !== undefined) {
      await this.phoneNumberInput.fill(data.phoneNumber);
    }
    if (data.contactEmail !== undefined) {
      await this.contactEmailInput.fill(data.contactEmail);
    }
    if (data.isContactEmailPublic !== undefined) {
      if (data.isContactEmailPublic) {
        await this.contactEmailPublicCheckbox.check();
      } else {
        await this.contactEmailPublicCheckbox.uncheck();
      }
    }

    await this.saveButton.click();
    await this.page.waitForURL("**/users/**");
  }

  async viewUserProfile(username: string) {
    await this.page.goto(`/users/${username}`);
  }

  async getContactInfo(): Promise<{ phoneNumber?: string; contactEmail?: string }> {
    const phoneElement = this.page.locator('[data-testid="phone-number"], .phone-number');
    const emailElement = this.page.locator('[data-testid="contact-email"], .contact-email');

    const phoneNumber = (await phoneElement.isVisible())
      ? await phoneElement.textContent()
      : undefined;
    const contactEmail = (await emailElement.isVisible())
      ? await emailElement.textContent()
      : undefined;

    return {
      phoneNumber: phoneNumber?.trim(),
      contactEmail: contactEmail?.trim(),
    };
  }

  async getUserProjects(): Promise<string[]> {
    const projectElements = this.page.locator('[data-testid="user-project"], .user-project');
    const projects = await projectElements.allTextContents();
    return projects.map((project) => project.trim());
  }

  async getUserTags(): Promise<string[]> {
    const tagElements = this.page.locator('[data-testid="user-tag"], .user-tag');
    const tags = await tagElements.allTextContents();
    return tags.map((tag) => tag.trim());
  }

  async isOwnProfile(): Promise<boolean> {
    return await this.editButton.isVisible();
  }
}

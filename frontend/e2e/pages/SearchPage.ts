import { Page, Locator } from "@playwright/test";

import { BasePage } from "./BasePage";

export interface SearchResult {
  title: string;
  description: string;
  author?: string;
  tags?: string[];
}

export class SearchPage extends BasePage {
  private searchInput: Locator;
  private searchButton: Locator;
  private searchResults: Locator;
  private tagFilters: Locator;
  private clearFiltersButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('input[type="search"], input[name="query"]');
    this.searchButton = page.locator('button[type="submit"]');
    this.searchResults = page.locator('[data-testid="search-results"], .search-results');
    this.tagFilters = page.locator('[data-testid="tag-filters"], .tag-filters');
    this.clearFiltersButton = page.locator('button[data-testid="clear-filters"]');
  }

  async searchByKeyword(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async filterByTag(tagName: string) {
    const tagButton = this.tagFilters.locator(`button:has-text("${tagName}")`);
    await tagButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async clearFilters() {
    if (await this.clearFiltersButton.isVisible()) {
      await this.clearFiltersButton.click();
      await this.page.waitForLoadState("networkidle");
    }
  }

  async getResults(): Promise<SearchResult[]> {
    const resultElements = this.searchResults.locator(
      '[data-testid="search-result"], .search-result',
    );
    const results: SearchResult[] = [];

    for (let i = 0; i < (await resultElements.count()); i++) {
      const element = resultElements.nth(i);
      const title =
        (await element.locator('[data-testid="result-title"], .result-title').textContent()) || "";
      const description =
        (await element
          .locator('[data-testid="result-description"], .result-description')
          .textContent()) || "";
      const author =
        (await element.locator('[data-testid="result-author"], .result-author').textContent()) ||
        undefined;

      const tagElements = element.locator('[data-testid="result-tag"], .result-tag');
      const tags = await tagElements.allTextContents();

      results.push({
        title: title.trim(),
        description: description.trim(),
        author: author?.trim(),
        tags: tags.map((tag) => tag.trim()),
      });
    }

    return results;
  }

  async getResultCount(): Promise<number> {
    return await this.searchResults
      .locator('[data-testid="search-result"], .search-result')
      .count();
  }

  async clickResult(index: number) {
    const result = this.searchResults
      .locator('[data-testid="search-result"], .search-result')
      .nth(index);
    await result.click();
  }

  async getActiveFilters(): Promise<string[]> {
    const activeFilterElements = this.tagFilters.locator(
      'button[data-active="true"], button.active',
    );
    const filters = await activeFilterElements.allTextContents();
    return filters.map((filter) => filter.trim());
  }

  async isNoResultsMessageVisible(): Promise<boolean> {
    return await this.page.locator('[data-testid="no-results"], .no-results').isVisible();
  }
}

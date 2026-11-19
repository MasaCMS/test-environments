import { expect, Page } from '@playwright/test';
import { siteManagerUrl } from '../../../e2e/helpers';

export class SiteManagerPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto(siteManagerUrl());
  }

  async expectVisible() {
    await expect(this.page).toHaveTitle(/Site Content/);
    await expect(this.page.getByText('Add User')).toBeAttached();
  }
}

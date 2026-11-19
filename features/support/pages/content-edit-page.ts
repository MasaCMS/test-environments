import { expect, Page } from '@playwright/test';
import { newPageUrl } from '../../../e2e/helpers';

export class ContentEditPage {
  constructor(private readonly page: Page) {}

  async createAndPublishPage(title: string) {
    await this.page.goto(newPageUrl());
    await this.page.locator('#mura-content-title-render').click();
    await this.page.keyboard.type(title);
    await this.page.locator('button.mura-primary', { hasText: 'Publish' }).click();
    // After publishing Masa returns to the site manager list.
    await expect(this.page).toHaveURL(/cArch\.list/);
  }
}

import { expect, Page } from '@playwright/test';
import { newPageUrl } from '../../../lib/helpers';

export class ContentEditPage {
  constructor(private readonly page: Page) {}

  /**
   * Creates and publishes content under Home. Pass `file` to upload it through
   * the editor's file input (the primary image of a Page, or the file of a File item).
   */
  async createAndPublish(title: string, options: { type?: 'Page' | 'File'; file?: string } = {}) {
    await this.page.goto(newPageUrl(options.type ?? 'Page'));
    await this.page.locator('#mura-content-title-render').click();
    await this.page.keyboard.type(title);
    if (options.file) {
      await this.page.locator('input[name=newfile]').first().setInputFiles(options.file);
    }
    await this.page.locator('button.mura-primary', { hasText: 'Publish' }).click();
    // After publishing Masa returns to the site manager list.
    await expect(this.page).toHaveURL(/cArch\.list/);
  }

  async createAndPublishPage(title: string) {
    await this.createAndPublish(title);
  }
}

import { expect, Page } from '@playwright/test';
import { newPageUrl } from '../../../lib/helpers';

export interface ContentDetails {
  title: string;
  type?: string;
  parentId?: string;
  body?: string;
  summary?: string;
  urlTitle?: string;
  htmlTitle?: string;
  metaDescription?: string;
  /** Scheduling: show the content only from this date (MM/DD/YYYY). */
  displayStart?: string;
  /** For Link content: the address the link points to. */
  linkUrl?: string;
  file?: string;
  /** Names of categories to assign to the content (they must exist). */
  categories?: string[];
  tags?: string[];
  /** The template file in the site's theme, for example `one_column.cfm`. */
  template?: string;
}

export class ContentEditPage {
  constructor(private readonly page: Page) {}

  /** Opens an empty editor for new content and waits until the rich text editors are ready. */
  async openNew(type = 'Page', parentId?: string) {
    await this.page.goto(newPageUrl(type, parentId));
    await this.page.locator('#mura-content-title-render').waitFor();
    if (['Page', 'Folder', 'Calendar', 'Gallery', 'Component'].includes(type)) {
      await this.waitForEditor();
    }
  }

  async waitForEditor() {
    await this.page.waitForFunction(() => (window as any).CKEDITOR?.instances?.body?.status === 'ready');
  }

  async fillTitle(title: string) {
    await this.page.locator('#mura-content-title-render').click();
    await this.page.keyboard.type(title);
  }

  /** Sets the body HTML directly, as if it was entered in the editor's source view. */
  async setBody(html: string) {
    await this.page.evaluate((data) => (window as any).CKEDITOR.instances.body.setData(data), html);
  }

  async setSummary(html: string) {
    await this.page.evaluate((data) => (window as any).CKEDITOR.instances.summary.setData(data), html);
  }

  async openTab(name: 'summary' | 'publishing' | 'layout' | 'schedule' | 'categories' | 'tags') {
    if (name === 'categories' || name === 'tags') {
      // These panels toggle: opening one that is already open would close it.
      if (!(await this.page.locator(`#panel-${name}`).isVisible())) await this.page.locator(`#heading-${name} a`).first().click();
      await expect(this.page.locator(`#panel-${name}`)).toBeVisible();
      return;
    }
    await this.page.locator(`a[href="#panel-${name}"]`).first().click();
  }

  /** Fills the form for new (or existing) content. Does not save. */
  async fill(details: ContentDetails) {
    await this.fillTitle(details.title);
    if (details.body !== undefined) await this.setBody(details.body);
    if (details.urlTitle) await this.page.locator('#urlTitle').fill(details.urlTitle);
    if (details.htmlTitle) await this.page.locator('#htmlTitle').fill(details.htmlTitle);
    if (details.summary !== undefined) await this.setSummary(details.summary);
    if (details.metaDescription) {
      await this.openTab('summary');
      await this.page.locator('#metadesc').fill(details.metaDescription);
    }
    if (details.template) {
      await this.openTab('layout');
      // Masa shows its own control instead of the select, so the value is set on the select itself.
      await this.page.locator('select[name=template]').selectOption(details.template, { force: true });
    }
    if (details.categories?.length) await this.assignCategories(details.categories);
    if (details.tags?.length) await this.addTags(details.tags);
    if (details.linkUrl) await this.page.locator('[name=body]').fill(details.linkUrl);
    if (details.file) await this.page.locator('input[name=newfile]').first().setInputFiles(details.file);
    if (details.displayStart) {
      // The scheduling controls live in a dialog; the form fields behind them are set directly.
      await this.page.evaluate((start) => {
        (document.querySelector('#mura-display') as HTMLSelectElement).value = '2';
        (document.querySelector('#mura-displayStart') as HTMLInputElement).value = `${start} 12:00 AM`;
      }, details.displayStart);
    }
  }

  async publish() {
    await this.page.locator('button.mura-primary', { hasText: 'Publish' }).click();
    // After publishing Masa returns to the site manager list.
    // Content opened from the version history returns to the history.
    await expect(this.page).toHaveURL(/cArch\.(list|hist)/);
  }

  /** Publishes a saved draft. Masa asks for confirmation, because publishing removes other drafts. */
  async publishDraft() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.publish();
  }

  async saveDraft() {
    await this.page.locator('button', { hasText: 'Save Draft' }).click();
    // Masa asks whether to keep editing after a draft is saved; leaving returns to the list.
    await this.page.getByRole('button', { name: 'No', exact: true }).click();
    await expect(this.page).toHaveURL(/cArch\.list/);
  }

  /** Creates and publishes content under Home (or `parentId`). */
  async createAndPublish(details: ContentDetails | string, options: { type?: 'Page' | 'File'; file?: string } = {}) {
    const d: ContentDetails = typeof details === 'string' ? { title: details, ...options } : details;
    await this.openNew(d.type ?? 'Page', d.parentId);
    await this.fill(d);
    await this.publish();
  }

  async createAndPublishPage(title: string) {
    await this.createAndPublish(title);
  }

  // ---- rich text editor -----------------------------------------------------

  private get bodyEditor() {
    return this.page.frameLocator('#cke_body iframe.cke_wysiwyg_frame').locator('body');
  }

  /** Types text into the body editor and applies a toolbar command to all of it. */
  async typeInBody(text: string) {
    await this.bodyEditor.click();
    await this.page.keyboard.type(text);
  }

  async applyToolbarCommandToBody(command: 'bold' | 'italic' | 'underline' | 'bulletedlist' | 'numberedlist') {
    await this.bodyEditor.click();
    await this.page.keyboard.press('ControlOrMeta+A');
    await this.page.locator(`#cke_body .cke_button__${command}`).click();
  }

  async bodyHtml(): Promise<string> {
    return this.page.evaluate(() => (window as any).CKEDITOR.instances.body.getData());
  }

  async setBodyThroughSourceView(html: string) {
    await this.page.locator('#cke_body .cke_button__source').click();
    // The source view is a code editor; set the content through the editor API while in source mode.
    await this.page.evaluate((data) => (window as any).CKEDITOR.instances.body.setData(data), html);
    // Switch back to the visual view so the editor writes the source back.
    await this.page.locator('#cke_body .cke_button__source').click();
    await this.page.locator('#cke_body iframe.cke_wysiwyg_frame').waitFor();
  }

  // ---- files from the file browser -------------------------------------------------------

  /** Opens the file browser (a window of its own) from an editor dialog and selects a file in it. */
  private async chooseFileInBrowser(fileName: string) {
    const [browser] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.page.getByText('Browse Server').click(),
    ]);
    await browser.waitForLoadState();
    await browser.getByPlaceholder('Type to filter').fill(fileName);
    // Pictures open in a window with a Select button (other files offer none here).
    await browser.locator('tbody tr td.var-width a', { hasText: fileName }).first().click();
    // Selecting a file closes the browser window by itself, so the click may end with the window gone.
    const closed = browser.waitForEvent('close');
    await browser.getByText('Select', { exact: true }).click({ noWaitAfter: true }).catch(() => {});
    await closed.catch(() => {});
  }

  /** Inserts an image into the body through the editor's image dialog and its Browse Server button. */
  async insertImageFromFileBrowser(fileName: string, altText: string) {
    await this.page.locator('#cke_body .cke_button__image').click();
    await this.chooseFileInBrowser(fileName);
    await expect(this.page.locator('.cke_dialog input.cke_dialog_ui_input_text').first()).not.toHaveValue('');
    await this.page.locator('.cke_dialog_contents input.cke_dialog_ui_input_text').nth(1).fill(altText);
    await this.page.locator('a.cke_dialog_ui_button_ok').click();
  }

  /** Links the selected body text to a file chosen in the file browser. */
  async linkSelectionToFileFromFileBrowser(fileName: string) {
    await this.page.locator('#cke_body .cke_button__link').click();
    await this.chooseFileInBrowser(fileName);
    await expect(this.page.locator('.cke_dialog input.cke_dialog_ui_input_text').first()).not.toHaveValue('');
    await this.page.locator('a.cke_dialog_ui_button_ok').click();
  }

  /** Types text into the body and selects all of it, ready to be made a link. */
  async typeAndSelectBodyText(text: string) {
    await this.typeInBody(text);
    await this.page.keyboard.press('ControlOrMeta+A');
  }

  // ---- categories and tags -----------------------------------------------------------------

  /** Ticks the categories in the "Manage Categories" panel of the Categories tab. */
  async assignCategories(names: string[]) {
    await this.openTab('categories');
    await this.page.getByText('Manage Categories').click();
    for (const name of names) {
      const box = this.page.locator('#bigui__categories label', { hasText: name }).locator('input[type=checkbox]');
      if (!(await box.isChecked())) await box.evaluate((el: HTMLInputElement) => el.click());
    }
    await this.page.locator('#bigui__categories a.bigui__close').click();
    for (const name of names) await expect(this.page.locator('#categories__selected')).toContainText(name);
  }

  async removeCategories(names: string[]) {
    await this.openTab('categories');
    await this.page.getByText('Manage Categories').click();
    for (const name of names) {
      const box = this.page.locator('#bigui__categories label', { hasText: name }).locator('input[type=checkbox]');
      if (await box.isChecked()) await box.evaluate((el: HTMLInputElement) => el.click());
    }
    await this.page.locator('#bigui__categories a.bigui__close').click();
  }

  /** Types each tag into the tag box and confirms it with Enter. */
  async addTags(tags: string[]) {
    await this.openTab('tags');
    const input = this.page.locator('#tags input[type=text][name=tags]');
    for (const tag of tags) {
      await input.fill(tag);
      await this.page.keyboard.press('Enter');
      await expect(this.page.locator('#tags .tag', { hasText: tag })).toBeVisible();
    }
  }

  /** Removes every category and tag the content has. */
  async clearCategoriesAndTags() {
    // Categories first: opening the Categories panel while the Tags panel is open does not work.
    await this.openTab('categories');
    await this.page.getByText('Manage Categories').click();
    const boxes = this.page.locator('#bigui__categories input[type=checkbox]');
    for (const box of await boxes.all()) {
      if (await box.isChecked()) await box.evaluate((el: HTMLInputElement) => el.click());
    }
    await this.page.locator('#bigui__categories a.bigui__close').click();
    await this.openTab('tags');
    const tags = this.page.locator('#tags .tag');
    while ((await tags.count()) > 0) await tags.first().locator('i.mi-times-circle').click();
  }

  async removeTag(tag: string) {
    await this.openTab('tags');
    await this.page.locator('#tags .tag', { hasText: tag }).locator('i.mi-times-circle').click();
    await expect(this.page.locator('#tags .tag', { hasText: tag })).toHaveCount(0);
  }
}

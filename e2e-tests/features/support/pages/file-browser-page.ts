import { expect, Locator, Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIXTURES = join(__dirname, '../../../fixtures');

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  pdf: 'application/pdf',
  txt: 'text/plain',
};

export type Area = 'User Assets' | 'Site Files' | 'Application Root';

/** Content > File Browser in the admin: upload, folders, rename, delete, download and the image editor. */
export class FileBrowserPage {
  constructor(private readonly page: Page) {}

  async open(area: Area = 'User Assets') {
    await this.page.goto('/admin/?muraAction=cFilemanager.default&siteid=default');
    await expect(this.page.getByText('Drop files here to upload')).toBeVisible();
    if (area !== 'User Assets') {
      await this.page.getByRole('link', { name: area }).click();
      await expect(this.page.getByText('Drop files here to upload')).toBeVisible();
    }
  }

  /**
   * Uploads a fixture file under another name, because the file browser keeps its files
   * between runs. `as` is the file name to upload it as.
   */
  async upload(fixture: string, as: string) {
    const extension = fixture.split('.').pop()!;
    await this.page.locator('input[type=file].file-input-field').setInputFiles({
      name: as,
      mimeType: MIME[extension] ?? 'application/octet-stream',
      buffer: readFileSync(join(FIXTURES, fixture)),
    });
    // The list shows 25 files per page, so the new file is looked up with the filter.
    await this.filter(as);
    await expect(this.link(as)).toBeVisible();
  }

  /** The text box of the dialog Masa opens for a name; it is the only visible box without a name of its own. */
  private dialogInput(): Locator {
    return this.page.locator('input:visible:not([name]):not(.filebrowser-filter)');
  }

  private link(name: string): Locator {
    return this.page.locator('tbody tr td.var-width a', { hasText: new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) });
  }

  async names(): Promise<string[]> {
    return (await this.page.locator('tbody tr td.var-width a').allInnerTexts()).map((n) => n.trim());
  }

  async filter(text: string) {
    await this.page.getByPlaceholder('Type to filter').fill(text);
  }

  /** True when the (filtered) list shows an entry with exactly this name. Waits for the list to settle. */
  async listsName(name: string): Promise<boolean> {
    await this.filter(name);
    // Masa reloads the list after the filter changes, after a rename or after a delete.
    await this.page.waitForTimeout(800);
    return (await this.link(name).count()) > 0;
  }

  // ---- a file's own window -------------------------------------------------------------

  async openFile(name: string) {
    await this.filter(name);
    await this.link(name).click();
    await expect(this.page.getByText('Rename', { exact: true })).toBeVisible();
  }

  /** The line under the picture, for example `photo.jpg (2kb 400x300)`. */
  async caption(): Promise<string> {
    return (await this.page.getByText(/\(\d+\w+ \d+x\d+\)|\(\d+\w+\)/).first().innerText()).trim();
  }

  async dimensions(): Promise<string> {
    return (await this.caption()).match(/(\d+x\d+)/)![1];
  }

  /** Address of the picture in the file's window; it is the public address of the file. */
  async pictureAddress(): Promise<string> {
    const src = await this.page.locator('img:visible').last().getAttribute('src');
    expect(src, 'the file window shows a picture').toBeTruthy();
    return src!;
  }

  async rename(newName: string) {
    await this.page.getByText('Rename', { exact: true }).click();
    // The dialog asks for the name without its extension.
    await this.dialogInput().fill(newName);
    await this.page.getByRole('button', { name: 'Save' }).click();
  }

  /** The Download button opens the file in a new tab; its content is fetched from that address. */
  async download(): Promise<Buffer> {
    const [popup] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.page.getByText('Download', { exact: true }).click(),
    ]);
    const address = popup.url();
    await popup.close();
    const response = await this.page.request.get(address);
    expect(response.status()).toBe(200);
    return response.body();
  }

  async deleteOpenFile() {
    await this.page.getByText('Delete', { exact: true }).click();
    // Masa asks "Confirm Deletion" in a dialog of its own; the list reloads afterwards.
    await this.page.locator('.dialog-confirm button', { hasText: 'Delete' }).click();
  }

  async close() {
    await this.page.getByText('Close', { exact: true }).click();
  }

  // ---- text files ------------------------------------------------------------------------

  /** Opening a text file shows an editor for its content instead of a picture. */
  async openTextFile(name: string) {
    await this.link(name).click();
    await expect(this.page.getByRole('button', { name: 'Update' })).toBeVisible();
  }

  async textContent(): Promise<string> {
    return this.page.locator('textarea:visible').inputValue();
  }

  async replaceText(text: string) {
    await this.page.locator('textarea:visible').fill(text);
    await this.page.getByRole('button', { name: 'Update' }).click();
    await expect(this.page.getByRole('button', { name: 'Update' })).toBeHidden();
  }

  // ---- image editor ---------------------------------------------------------------------

  async editImage() {
    await this.page.getByText('Edit Image', { exact: true }).click();
    await expect(this.page.getByText('Rotate Right', { exact: true })).toBeVisible();
  }

  async rotateRight() {
    await this.page.getByText('Rotate Right', { exact: true }).click();
  }

  async rotateLeft() {
    await this.page.getByText('Rotate Left', { exact: true }).click();
  }

  async resize(width: number, height: number) {
    await this.page.getByText('Resize', { exact: true }).click();
    await this.page.locator('input[name=resize-width]').fill(String(width));
    await this.page.locator('input[name=resize-height]').fill(String(height));
    // Masa resizes the file and reloads the list; opening the file too early shows the old size.
    const reloaded = this.page.waitForResponse((r) => /filebrowser\/browse/.test(r.url()));
    await this.page.getByText('Confirm', { exact: true }).click();
    await reloaded;
  }

  async backFromEditor() {
    // After a resize Masa leaves the editor by itself.
    const back = this.page.getByText('Back', { exact: true });
    if (await back.isVisible({ timeout: 2_000 }).catch(() => false)) await back.click();
  }

  // ---- folders ---------------------------------------------------------------------------

  async createFolder(name: string) {
    await this.page.locator('a:has(i[title="Add Folder"])').click();
    await this.dialogInput().fill(name);
    await this.page.getByRole('button', { name: 'Save' }).click();
    await expect(this.link(name)).toBeVisible();
  }

  async openFolder(name: string) {
    await this.link(name).click();
  }
}

import { expect, Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SITE_ID } from '../../../lib/helpers';

export interface BundleOptions {
  includeTrash?: boolean;
  includeVersionHistory?: boolean;
  includeFormData?: boolean;
  includeUsers?: boolean;
}

/** A site bundle that was downloaded; its parts can be read as text. */
export class DownloadedBundle {
  constructor(
    readonly fileName: string,
    readonly path: string,
  ) {}

  entries(): string[] {
    return execFileSync('unzip', ['-Z1', this.path], { encoding: 'utf8' }).split('\n').filter(Boolean);
  }

  read(entry: string): string {
    return execFileSync('unzip', ['-p', this.path, entry], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  }
}

export class BundlesPage {
  bundle?: DownloadedBundle;

  constructor(private readonly page: Page) {}

  /** Creates a site bundle with the given options and downloads it. */
  async create(options: BundleOptions = {}) {
    await this.page.goto(`/admin/?muraAction=cSettings.selectBundleOptions&siteID=${SITE_ID}`);
    for (const [name, on] of Object.entries(options)) {
      if (on) await this.page.locator(`input[name=${name}]`).check();
    }
    await this.page.getByRole('button', { name: 'Create Bundle' }).click();
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 120_000 }),
      // Masa asks whether to create and download the bundle file.
      this.page.getByRole('button', { name: 'Yes', exact: true }).click(),
    ]);
    const path = join(mkdtempSync(join(tmpdir(), 'masa-bundle-')), download.suggestedFilename());
    await download.saveAs(path);
    this.bundle = new DownloadedBundle(download.suggestedFilename(), path);
  }

  get downloaded(): DownloadedBundle {
    if (!this.bundle) throw new Error('No bundle was created in this scenario');
    return this.bundle;
  }

  /** The Deploy Bundle tab of the site settings. */
  async openDeploy() {
    await this.page.goto(`/admin/?muraAction=cSettings.editSite&siteid=${SITE_ID}&deployBundle`);
    await this.page.locator('a[href="#tabBundles"]').click();
    await expect(this.page.locator('#tabBundles')).toBeVisible();
  }

  async deployOptions(): Promise<string[]> {
    const labels = await this.page.locator('#tabBundles label.checkbox').allInnerTexts();
    return labels.map((l) => l.trim());
  }
}

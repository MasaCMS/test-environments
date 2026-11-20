import { expect, Locator, Page } from '@playwright/test';
import { join } from 'node:path';

const FIXTURES = join(__dirname, '../../../fixtures');
export const PLUGIN_ZIPS = {
  1: join(FIXTURES, 'test-plugin.zip'),
  2: join(FIXTURES, 'test-plugin-v2.zip'),
} as const;

export interface PluginRow {
  name: string;
  directory: string;
  category: string;
  version: string;
  provider: string;
}

/** Plugins in the admin: Global Settings > Plugins (install, edit, delete) and Site Plugins (per site). */
export class PluginsPage {
  /** Set when a scenario installed something, so that the plugin is removed again afterwards. */
  touched = false;

  constructor(private readonly page: Page) {}

  async openGlobalList() {
    await this.page.goto('/admin/?muraAction=cSettings.list&plugins#tabPlugins');
    await expect(this.page.getByText('Install Plugin')).toBeVisible();
  }

  // The sites are listed in a table on the same page, in another tab.
  private get pluginTable() {
    return this.page.locator('#tabPlugins table');
  }

  private rowOf(name: string): Locator {
    return this.pluginTable.locator('tbody tr', { has: this.page.locator('td.var-width', { hasText: name }) }).first();
  }

  async rows(): Promise<PluginRow[]> {
    const rows = await this.pluginTable.locator('tbody tr', { has: this.page.locator('td.var-width') }).all();
    const result: PluginRow[] = [];
    for (const row of rows) {
      const [name, directory, category, version, provider] = (await row.locator('td:not(.actions)').allInnerTexts()).map((t) => t.trim());
      result.push({ name, directory, category, version, provider });
    }
    return result;
  }

  async isInstalled(name: string): Promise<boolean> {
    await this.openGlobalList();
    return (await this.rowOf(name).count()) > 0;
  }

  /** Installs a plugin from a zip file; Masa then shows the plugin's settings. */
  async deploy(version: 1 | 2 = 1) {
    this.touched = true;
    await this.openGlobalList();
    await this.page.locator('input[type=file][name=newPlugin]').setInputFiles(PLUGIN_ZIPS[version]);
    await this.page.getByRole('button', { name: 'Deploy' }).click();
    await expect(this.page).toHaveURL(/cSettings\.editPlugin/);
    await expect(this.page.getByRole('heading', { name: 'Plugin Settings' })).toBeVisible();
  }

  /**
   * Updates an installed plugin to a newer version: Plugin Settings > Update Plugin Version, then
   * upload the new zip. (Uploading it again through Install Plugin would install a second copy.)
   */
  async updateVersion(name: string, version: 1 | 2) {
    this.touched = true;
    await this.openSettings(name);
    await this.page.getByRole('link', { name: 'Update Plugin Version' }).click();
    await expect(this.page.getByRole('heading', { name: 'Update Plugin Version' })).toBeVisible();
    await this.page.locator('input[type=file][name=newPlugin]').setInputFiles(PLUGIN_ZIPS[version]);
    await this.page.getByRole('button', { name: 'Deploy' }).click();
    await expect(this.page).toHaveURL(/cSettings\.editPlugin/);
  }

  async delete(name: string) {
    await this.openGlobalList();
    const row = this.rowOf(name);
    await row.locator('a.show-actions').click();
    await row.locator('li.delete a').click();
    await this.page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(this.pluginTable.locator('td.var-width', { hasText: name })).toHaveCount(0);
  }

  async deleteIfInstalled(name: string) {
    if (await this.isInstalled(name)) await this.delete(name);
  }

  /** Opens the settings page of an installed plugin (Global Settings > Plugins > Edit). */
  async openSettings(name: string) {
    await this.openGlobalList();
    const href = await this.rowOf(name).locator('li.edit a').getAttribute('href');
    await this.page.goto(new URL(href!, this.page.url()).toString());
    await expect(this.page.getByRole('heading', { name: 'Plugin Settings' })).toBeVisible();
  }

  // Masa styles its checkboxes, so a plain check() may not change them; click the input in the page.
  private async setChecked(box: Locator, checked: boolean) {
    if ((await box.isChecked()) !== checked) await box.evaluate((el: HTMLInputElement) => el.click());
    await expect(box).toBeChecked({ checked });
  }

  private async saveSettings() {
    await this.page.getByRole('button', { name: 'Update' }).click();
    await expect(this.page).toHaveURL(/cSettings\.list/);
  }

  /** A plugin is active on the sites it is assigned to; removing the assignment deactivates it there. */
  async assignToSite(name: string, assigned: boolean, siteId = 'default') {
    await this.openSettings(name);
    await this.setChecked(this.page.locator(`input[name=siteAssignID][value=${siteId}]`), assigned);
    await this.saveSettings();
  }

  async changeSetting(name: string, setting: string, value: string) {
    await this.openSettings(name);
    await this.page.locator(`input[name=${setting}]`).fill(value);
    await this.saveSettings();
  }

  async settingValue(name: string, setting: string): Promise<string> {
    await this.openSettings(name);
    return this.page.locator(`input[name=${setting}]`).inputValue();
  }

  async sitePlugins(): Promise<string[]> {
    await this.page.goto('/admin/?muraAction=cPlugins.list&siteid=default');
    await expect(this.page.getByRole('heading', { name: 'Site Plugins' })).toBeVisible();
    return (await this.page.locator('table tbody td.var-width').allInnerTexts()).map((t) => t.trim());
  }

  /** The plugin's own admin page, at /plugins/<package>/. Returns the HTTP status. */
  async adminPageStatus(packageName: string): Promise<number> {
    const response = await this.page.goto(`/plugins/${packageName}/`);
    return response!.status();
  }
}

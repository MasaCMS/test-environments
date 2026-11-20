import { expect, Page, test } from '@playwright/test';
import { slugOf } from './public-site-page';

// Display objects in the layout manager's list, with the id Masa uses for them in the page.
export const DISPLAY_OBJECTS: Record<string, string> = {
  Button: 'button',
  Collection: 'collection',
  Container: 'container',
  'Call to Action': 'cta',
  Embed: 'embed',
  Form: 'form',
  Image: 'image',
  Info: 'info',
  Media: 'media',
  Navigation: 'nav',
  Plugin: 'plugin',
  'Site Search': 'search',
  Text: 'text',
};

export function objectId(label: string): string {
  const id = DISPLAY_OBJECTS[label];
  if (!id) throw new Error(`Unknown display object "${label}"`);
  return id;
}

/** The front-end layout manager ("Inline Edit"): drag display objects from a list into regions. */
export class LayoutManagerPage {
  constructor(private readonly page: Page) {}

  // The main content region of the default theme.
  private readonly region = '.mura-region-local[data-regionid="2"]';

  private get configurator() {
    return this.page.frameLocator('#frontEndToolsSidebariframe');
  }

  /** Opens a page on the front end and switches on inline editing. */
  async startInlineEditing(title: string) {
    await this.page.goto(`/index.cfm/${slugOf(title)}/`);
    await this.page.locator('li.dropdown:has(a:text-is("Inline Edit")) > a.dropdown-toggle').click();
    await this.page.getByText('Inline Edit', { exact: true }).first().click();
    await expect(this.page.getByText('Drag to Page:')).toBeVisible();
    // The drag and drop behaviour is attached a moment after the list shows; it has no visible sign.
    await this.page.waitForTimeout(2_500);
  }

  async offeredObjects(): Promise<string[]> {
    const labels = await this.page.locator('.mura-sidebar__objects-list__object-item').allInnerTexts();
    return labels.map((label) => label.trim());
  }

  /** Data-object ids of the display objects in the main content region, in page order. */
  async objects(): Promise<string[]> {
    return this.page
      .locator(`${this.region} .mura-object`)
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-object') ?? ''));
  }

  /**
   * Drags a display object from the list into the main content region; with `above`,
   * onto the top of that object, so it lands before it.
   */
  async addObject(label: string, options: { above?: string; keepSettingsOpen?: boolean } = {}) {
    const before = (await this.objects()).length;
    const item = this.page.locator(`.mura-sidebar__objects-list__object-item[data-object=${objectId(label)}]`);
    const from = (await item.boundingBox())!;
    const target = options.above
      ? this.page.locator(`${this.region} .mura-object[data-object=${objectId(options.above)}]`).first()
      : this.page.locator(this.region).first();
    const box = (await target.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = options.above ? box.y + 3 : box.y + box.height / 2;

    const mouse = this.page.mouse;
    await mouse.move(from.x + 20, from.y + 15);
    await mouse.down();
    await mouse.move(600, 500, { steps: 10 });
    await mouse.move(x, y, { steps: 15 });
    await this.page.waitForTimeout(600); // the drop zone highlights while hovering
    await mouse.move(x + 2, y + 1, { steps: 3 });
    await mouse.up();
    await expect.poll(async () => (await this.objects()).length, { message: `"${label}" was dropped` }).toBe(before + 1);
    if (!options.keepSettingsOpen) await this.closeConfigurator();
  }

  /** A dropped object opens its settings in the sidebar; closing them returns to the list. */
  async closeConfigurator() {
    const close = this.configurator.locator('i.mi-close');
    await close.click({ timeout: 10_000 }).catch(() => {});
    await expect(this.page.getByText('Drag to Page:')).toBeVisible();
  }

  async openSettings(label: string) {
    await this.page.locator(`${this.region} .mura-object[data-object=${objectId(label)}]`).first().click();
    await expect(this.configurator.locator('a.mura-delete')).toBeVisible();
  }

  async removeObject(label: string) {
    const before = (await this.objects()).length;
    await this.openSettings(label);
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.configurator.locator('a.mura-delete').click();
    // Masa may ask for confirmation in a dialog of its own.
    const confirm = this.page.getByRole('button', { name: /^(yes|ok|confirm)$/i });
    if (await confirm.isVisible({ timeout: 2_000 }).catch(() => false)) await confirm.click();
    await expect.poll(async () => (await this.objects()).length).toBe(before - 1);
  }

  /** Changes how many items the Collection object shows, in its settings. */
  // Masa hides the native select behind its own styled control, so the values are set on the select itself.
  async setCollectionMaxItems(count: number) {
    await this.openSettings('Collection');
    const maxItems = this.configurator.locator('select[name=maxItems]');
    // Masa 8 no longer has Max Items on the Collection object: the limit is a setting of the collection itself.
    test.skip(!(await maxItems.count()), 'The Collection object has no Max Items setting in this Masa version');
    await maxItems.selectOption(String(count), { force: true });
    await this.closeConfigurator();
  }

  /** Makes the Collection object list the content of a local index (a collection made in the admin). */
  async setCollectionSource(collectionName: string) {
    await this.openSettings('Collection');
    await this.configurator.locator('select[name=sourcetype]').selectOption('localindex', { force: true });
    await this.configurator.locator('select[name=source]').filter({ has: this.page.locator(`option:text-is("${collectionName}")`) }).selectOption({ label: collectionName }, { force: true });
    await this.closeConfigurator();
  }

  /**
   * Adds a display object that a plugin provides: drops the generic Plugin object and picks the
   * plugin and its display object in the settings that open (a dialog of its own).
   */
  async addPluginObject(pluginName: string, displayObjectName: string) {
    await this.addObject('Plugin', { keepSettingsOpen: true });
    const dialog = this.page.frameLocator('#frontEndToolsModaliframe');
    await dialog.locator('select[name=subClassSelector]').selectOption({ label: pluginName }, { force: true });
    await dialog.locator('select#availableObjectSelector').selectOption({ label: displayObjectName }, { force: true });
    await dialog.locator('a:visible', { hasText: 'Apply' }).first().click();
    await expect(this.page.locator(`${this.region} .mura-object[data-object=plugin]`)).toHaveCount(1);
  }

  /** Makes the Form display object show a form made in the Form Builder. */
  async setForm(formTitle: string) {
    await this.openSettings('Form');
    await this.configurator.locator('#availableObjectSelector').selectOption({ label: formTitle }, { force: true });
    await this.closeConfigurator();
  }

  /** Publishes the inline changes; Masa reloads the page afterwards. */
  async publish() {
    await this.page.locator('.mura-toolbar a.dropdown-toggle.btn-primary').first().click();
    this.page.on('dialog', (dialog) => dialog.accept());
    const reloaded = this.page.waitForEvent('load');
    await this.page.locator('a.mura-inline-save', { hasText: 'Publish' }).first().click();
    await reloaded;
    await this.page.waitForLoadState('networkidle');
  }
}

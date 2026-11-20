import { expect, Page } from '@playwright/test';

/** Categories in the admin (Content > Categories). */
export class CategoriesPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/admin/?muraAction=cCategory.list&siteid=default');
    await expect(this.page.getByRole('heading', { name: 'Categories' })).toBeVisible();
  }

  /** Adds a category, at the top level or below another one. */
  async create(name: string, parent?: string) {
    await this.page.goto('/admin/?muraAction=cCategory.edit&categoryID=&parentID=&siteid=default');
    await this.page.locator('input[name=name]').fill(name);
    if (parent) await this.page.locator('select[name=parentID]').selectOption({ label: parent });
    await this.page.getByRole('button', { name: 'Add' }).click();
    await expect(this.page).toHaveURL(/cCategory\.list/);
  }

  private rowOf(name: string) {
    return this.page.locator('table tbody tr', { has: this.page.locator('a[title=Edit]', { hasText: new RegExp(`^${name}$`) }) });
  }

  async isListed(name: string): Promise<boolean> {
    await this.open();
    return (await this.rowOf(name).count()) > 0;
  }

  /** How deep a category sits in the list: 0 for top level categories. */
  async depthOf(name: string): Promise<number> {
    await this.open();
    const className = await this.rowOf(name).locator('td.var-width ul').first().getAttribute('class');
    // Top level categories have the class "nestoff" ("neston" when they have children), children "nest1off", grandchildren "nest2off".
    const match = className?.match(/nest(\d*)(?:on|off)/);
    return match ? Number(match[1] || 0) : -1;
  }

  /** The names in the order the list shows them. */
  async names(): Promise<string[]> {
    await this.open();
    return (await this.page.locator('table tbody tr td.var-width a[title=Edit]').allInnerTexts()).map((n) => n.trim());
  }

  async delete(name: string) {
    await this.open();
    const row = this.rowOf(name);
    // The row's own menu is hidden; its Delete link asks for confirmation in a dialog of Masa's.
    await row.locator('li.delete a').evaluate((a: HTMLAnchorElement) => a.click());
    await this.page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(this.rowOf(name)).toHaveCount(0);
  }
}

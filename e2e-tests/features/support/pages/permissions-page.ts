import { expect, Page } from '@playwright/test';
import { HOME_CONTENT_ID, SITE_ID, SITE_MANAGER_MODULE } from '../../../lib/helpers';

export type PermissionLevel = 'editor' | 'author' | 'none' | 'read' | 'deny';

/** Group permissions on content and on the Site Manager module. */
export class PermissionsPage {
  constructor(private readonly page: Page) {}

  /** Sets a group's permission on one content item. "none" means inherit from the parent. */
  async setContentPermission(contentId: string, group: string, level: PermissionLevel, parentId = HOME_CONTENT_ID) {
    await this.page.goto(
      `/admin/?muraAction=cPerm.main&contentid=${contentId}&type=Page&parentid=${parentId}&topid=${HOME_CONTENT_ID}` +
        `&siteid=${SITE_ID}&moduleid=${SITE_MANAGER_MODULE}&startrow=1`,
    );
    // The radio buttons are styled, so the input itself is clicked.
    await this.page.locator('tr', { hasText: group }).locator(`input[value=${level}]`).click({ force: true });
    await this.page.getByRole('button', { name: 'Update' }).click();
    await expect(this.page).toHaveURL(/cArch\.list/);
  }

  /** Lets a group use the Site Manager at all; what it can do there comes from the content permissions. */
  async allowSiteManager(group: string) {
    await this.page.goto(
      `/admin/?muraAction=cPerm.module&contentid=${SITE_MANAGER_MODULE}&siteid=${SITE_ID}&moduleid=${SITE_MANAGER_MODULE}`,
    );
    await this.page.locator('tr', { hasText: group }).locator('input[name=groupid]').click({ force: true });
    await this.page.getByRole('button', { name: 'Update' }).click();
    await expect(this.page).toHaveURL(/cArch\.list/);
  }
}

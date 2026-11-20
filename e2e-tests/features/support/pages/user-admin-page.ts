import { expect, Page } from '@playwright/test';
import { SITE_ID } from '../../../lib/helpers';

// The lists show 25 records per page; this shows them all, so a new record is always on the page.
const ALL = 100000;

export interface NewUser {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  /** A system user can use the admin; a site member can only log in on the public site. */
  system: boolean;
  groups?: string[];
  active?: boolean;
}

/** Users and groups in the admin. */
export class UserAdminPage {
  constructor(private readonly page: Page) {}

  /** The kind of user is chosen by the form's address; there is no visible control for it. */
  async createUser(user: NewUser) {
    await this.page.goto(`/admin/?muraAction=cUsers.edituser&siteid=${SITE_ID}&userid=${user.system ? '&setispublic=0' : ''}`);
    await this.page.locator('#fname').fill(user.firstName);
    await this.page.locator('#lname').fill(user.lastName);
    await this.page.locator('#email').fill(`${user.username}@example.com`);
    await this.page.locator('#username').fill(user.username);
    await this.page.locator('#passwordNoCache').fill(user.password);
    await this.page.locator('#password2').fill(user.password);
    if (user.active === false) {
      await this.page.locator('a[href="#tabAdvanced"]').click();
      await this.page.locator('label:has(input[name=InActive][value="1"])').click();
    }
    if (user.groups?.length) {
      await this.page.locator('a[href="#tabGroupmemberships"]').click();
      for (const group of user.groups) await this.page.locator('label', { hasText: group }).click();
    }
    await this.page.locator('button.mura-primary', { hasText: 'Add' }).click();
  }

  async createGroup(name: string, options: { system: boolean }) {
    await this.page.goto(`/admin/?muraAction=cUsers.editgroup&siteid=${SITE_ID}&userid=`);
    if (options.system) await this.page.locator('label', { hasText: 'System Group' }).click();
    await this.page.locator('input[name=groupname]').fill(name);
    await this.page.locator('button.mura-primary', { hasText: 'Add' }).click();
    await expect(this.page).toHaveURL(/cUsers\.list/);
  }

  async expectUserSaved(system: boolean) {
    await expect(this.page).toHaveURL(new RegExp(`cUsers\\.listUsers&ispublic=${system ? 0 : 1}&recordsperpage=${ALL}`));
  }

  /** The red message shown above the user form when saving failed. */
  async expectFormError(message: RegExp) {
    await expect(this.page).toHaveURL(/cUsers\.edituser/);
    await expect(this.page.locator('.alert, .mura-alert, [class*=error]').filter({ hasText: message }).first()).toBeVisible();
  }

  async expectUserListed(lastName: string, system: boolean) {
    await this.page.goto(`/admin/?muraAction=cUsers.listUsers&siteid=${SITE_ID}&ispublic=${system ? 0 : 1}&recordsperpage=${ALL}`);
    await expect(this.page.getByText(lastName).first()).toBeVisible();
  }

  async expectUserNotListed(lastName: string) {
    for (const ispublic of [0, 1]) {
      await this.page.goto(`/admin/?muraAction=cUsers.listUsers&siteid=${SITE_ID}&ispublic=${ispublic}&recordsperpage=${ALL}`);
      await expect(this.page.getByText(lastName)).toHaveCount(0);
    }
  }

  /** The number in brackets after a group's name in the group list. */
  async memberCount(group: string, system: boolean): Promise<number> {
    await this.page.goto(`/admin/?muraAction=cUsers.list&siteid=${SITE_ID}&ispublic=${system ? 0 : 1}&recordsperpage=${ALL}`);
    const row = this.page.locator('tr', { hasText: group }).first();
    const text = await row.innerText();
    const match = text.match(new RegExp(`${group}\\s*\\((\\d+)\\)`));
    expect(match, `member count for group "${group}"`).toBeTruthy();
    return Number(match![1]);
  }

  async expectGroupListed(group: string, system: boolean) {
    await this.page.goto(`/admin/?muraAction=cUsers.list&siteid=${SITE_ID}&ispublic=${system ? 0 : 1}&recordsperpage=${ALL}`);
    await expect(this.page.getByText(group).first()).toBeVisible();
  }
}

import { expect, Page } from '@playwright/test';
import { ADMIN_PASSWORD, ADMIN_USER } from '../../../lib/helpers';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/admin/');
  }

  async submit(user: string, password: string) {
    await this.page.locator('#username').fill(user);
    await this.page.locator('#password').fill(password);
    await Promise.all([
      this.page.waitForURL(/muraAction=|\/admin\/?(\?|$)/),
      this.page.locator('#loginForm').getByRole('button').first().click(),
    ]);
  }

  async loginAsAdministrator() {
    await this.submit(ADMIN_USER, ADMIN_PASSWORD);
  }

  async loginWithWrongPassword() {
    await this.submit(ADMIN_USER, `${ADMIN_PASSWORD}-wrong`);
  }

  async expectVisible() {
    await expect(this.page).toHaveTitle(/Login/);
    await expect(this.page.locator('#username')).toBeVisible();
  }
}

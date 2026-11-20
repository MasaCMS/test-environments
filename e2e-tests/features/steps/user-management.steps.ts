import { expect } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import { Accounts } from '../support/fixtures';
import { PermissionLevel } from '../support/pages/permissions-page';

const SYSTEM = { system: true };
const MEMBER = { system: false };

// ---- groups ------------------------------------------------------------------

Given('a system group {string}', async ({ userAdmin, names }, name: string) => {
  await userAdmin.createGroup(names.uniqueWithoutSpaces(name), SYSTEM);
});
When('I create a system group {string}', async ({ userAdmin, names }, name: string) => {
  await userAdmin.createGroup(names.uniqueWithoutSpaces(name), SYSTEM);
});
When('I create a member group {string}', async ({ userAdmin, names }, name: string) => {
  await userAdmin.createGroup(names.uniqueWithoutSpaces(name), MEMBER);
});

Then('the system group {string} is listed', async ({ userAdmin, names }, name: string) => {
  await userAdmin.expectGroupListed(names.resolve(name), true);
});
Then('the member group {string} is listed', async ({ userAdmin, names }, name: string) => {
  await userAdmin.expectGroupListed(names.resolve(name), false);
});

Then(
  'the system group {string} has {int} member(s)',
  async ({ userAdmin, names }, name: string, count: number) => {
    expect(await userAdmin.memberCount(names.resolve(name), true)).toBe(count);
  },
);

// ---- users -------------------------------------------------------------------

async function createUser(
  { userAdmin, names, accounts }: { userAdmin: any; names: any; accounts: Accounts },
  label: string,
  options: { system: boolean; groups?: string[]; active?: boolean; lastName?: string },
) {
  const username = names.uniqueWithoutSpaces(label).toLowerCase();
  const lastName = options.lastName ?? names.fill(`${label}-<unique>`);
  const groups = (options.groups ?? []).map((g) => names.resolve(g));
  await userAdmin.createUser({
    firstName: 'Test',
    lastName,
    username,
    password: Accounts.PASSWORD,
    system: options.system,
    groups,
    active: options.active,
  });
  accounts.add(label, { username, lastName, groups });
}

When('I create a system user {string}', async ({ userAdmin, names, accounts }, label: string) => {
  await createUser({ userAdmin, names, accounts }, label, SYSTEM);
});
Given('a system user {string}', async ({ userAdmin, names, accounts }, label: string) => {
  await createUser({ userAdmin, names, accounts }, label, SYSTEM);
});
When('I create a system user {string} in the group {string}', async ({ userAdmin, names, accounts }, label: string, group: string) => {
  await createUser({ userAdmin, names, accounts }, label, { ...SYSTEM, groups: [group] });
});
Given('a system user {string} in the group {string}', async ({ userAdmin, names, accounts }, label: string, group: string) => {
  await createUser({ userAdmin, names, accounts }, label, { ...SYSTEM, groups: [group] });
});
When(
  'I create a system user {string} in the groups {string} and {string}',
  async ({ userAdmin, names, accounts }, label: string, first: string, second: string) => {
    await createUser({ userAdmin, names, accounts }, label, { ...SYSTEM, groups: [first, second] });
  },
);
When('I create a site member {string}', async ({ userAdmin, names, accounts }, label: string) => {
  await createUser({ userAdmin, names, accounts }, label, MEMBER);
});
When('I create an inactive system user {string}', async ({ userAdmin, names, accounts }, label: string) => {
  await createUser({ userAdmin, names, accounts }, label, { ...SYSTEM, active: false });
});
When('I create a system user {string} with the last name {string}', async ({ userAdmin, names, accounts }, label: string, lastName: string) => {
  await createUser({ userAdmin, names, accounts }, label, { ...SYSTEM, lastName: names.fill(lastName) });
});

When('I create another user with the same username as {string}', async ({ userAdmin, names, accounts }, label: string) => {
  const existing = accounts.get(label);
  const lastName = names.fill('Duplicate-<unique>');
  accounts.add('(duplicate)', { username: existing.username, lastName, groups: [] });
  await userAdmin.createUser({
    firstName: 'Copy',
    lastName,
    username: existing.username,
    password: Accounts.PASSWORD,
    system: true,
  });
});

Then('the system user {string} is listed', async ({ userAdmin, accounts }, label: string) => {
  await userAdmin.expectUserListed(accounts.get(label).lastName, true);
});
Then('the site member {string} is listed', async ({ userAdmin, accounts }, label: string) => {
  await userAdmin.expectUserListed(accounts.get(label).lastName, false);
});
Then('the user form refuses the username as already used', async ({ userAdmin }) => {
  await userAdmin.expectFormError(/is being used by another user/);
});
Then('only one user has the username of {string}', async ({ userAdmin, accounts }, label: string) => {
  await userAdmin.expectUserListed(accounts.get(label).lastName, true);
  await userAdmin.expectUserNotListed(accounts.get('(duplicate)').lastName);
});

// ---- logging in as the new user -------------------------------------------------

When('{string} logs in to the admin', async ({ accounts, newSession }, label: string) => {
  const session = await newSession();
  await session.login(accounts.get(label).username, Accounts.PASSWORD);
  accounts.sessions.set(label, session);
});

Then('{string} is logged in to the admin', async ({ accounts }, label: string) => {
  await accounts.sessions.get(label)!.expectLoggedIn();
});
Then('{string} is refused at the admin login', async ({ accounts }, label: string) => {
  await accounts.sessions.get(label)!.expectLoginRejected();
});
Then('{string} has no access to the Site Manager', async ({ accounts }, label: string) => {
  await accounts.sessions.get(label)!.expectNoAccessToSiteManager();
});

// ---- content permissions ---------------------------------------------------------

Given('the group {string} may use the Site Manager', async ({ groupPermissions, names }, group: string) => {
  await groupPermissions.allowSiteManager(names.resolve(group));
});

const LEVELS: Record<string, PermissionLevel> = { Editor: 'editor', Author: 'author', Read: 'read', Deny: 'deny', Inherit: 'none' };

When(
  'I give the group {string} {string} permission on the page {string}',
  async ({ groupPermissions, siteManager, names }, group: string, level: string, page: string) => {
    const contentId = await siteManager.contentIdOf(names.resolve(page));
    await groupPermissions.setContentPermission(contentId, names.resolve(group), LEVELS[level]);
  },
);
Given(
  'the group {string} has {string} permission on the page {string}',
  async ({ groupPermissions, siteManager, names }, group: string, level: string, page: string) => {
    const contentId = await siteManager.contentIdOf(names.resolve(page));
    await groupPermissions.setContentPermission(contentId, names.resolve(group), LEVELS[level]);
  },
);

When(
  'I give the group {string} {string} permission on the page {string} under {string}',
  async ({ groupPermissions, siteManager, names }, group: string, level: string, child: string, parent: string) => {
    const parentId = await siteManager.contentIdOf(names.resolve(parent));
    const contentId = await siteManager.contentIdOf(names.resolve(child), parentId);
    await groupPermissions.setContentPermission(contentId, names.resolve(group), LEVELS[level], parentId);
  },
);

Then(
  '{string} sees the page {string} in the Site Manager',
  async ({ accounts, names }, label: string, page: string) => {
    const titles = await accounts.sessions.get(label)!.visibleContent();
    expect(titles.some((t) => t.includes(names.resolve(page)))).toBe(true);
  },
);
Then(
  '{string} does not see the page {string} in the Site Manager',
  async ({ accounts, names }, label: string, page: string) => {
    const titles = await accounts.sessions.get(label)!.visibleContent();
    expect(titles.some((t) => t.includes(names.resolve(page)))).toBe(false);
  },
);
Then(
  '{string} sees the page {string} under {string} in the Site Manager',
  async ({ accounts, siteManager, names }, label: string, child: string, parent: string) => {
    const parentId = await siteManager.contentIdOf(names.resolve(parent));
    const titles = await accounts.sessions.get(label)!.visibleContent(parentId);
    expect(titles.some((t) => t.includes(names.resolve(child)))).toBe(true);
  },
);
Then(
  '{string} does not see the page {string} under {string} in the Site Manager',
  async ({ accounts, siteManager, names }, label: string, child: string, parent: string) => {
    const parentId = await siteManager.contentIdOf(names.resolve(parent));
    const titles = await accounts.sessions.get(label)!.visibleContent(parentId);
    expect(titles.some((t) => t.includes(names.resolve(child)))).toBe(false);
  },
);
Then('{string} can edit the page {string}', async ({ accounts, names }, label: string, page: string) => {
  expect(await accounts.sessions.get(label)!.canEdit(names.resolve(page))).toBe(true);
});
Then('{string} cannot edit the page {string}', async ({ accounts, names }, label: string, page: string) => {
  expect(await accounts.sessions.get(label)!.canEdit(names.resolve(page))).toBe(false);
});

// The administrator is never limited by group permissions.
Then('the administrator sees the page {string} in the Site Manager', async ({ siteManager, names }, page: string) => {
  await siteManager.contentIdOf(names.resolve(page));
});

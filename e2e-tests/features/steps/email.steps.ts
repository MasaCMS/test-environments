import { expect, test } from '@playwright/test';
import { Given, Then, When } from '../support/fixtures';
import { MAIL_SMTP_HOST, MAIL_SMTP_PORT } from '../../lib/mail-catcher';

// ---- the mail catcher -------------------------------------------------------------------

// The email tests need Mailpit (see lib/mail-catcher.ts); without it they are skipped.
Given('the mail catcher is running', async ({ mail }) => {
  test.skip(!(await mail.isRunning()), 'Mailpit is not running: docker compose -f e2e-tests/mail/docker-compose.yml up -d');
  await mail.clear();
});

Given('the site sends its email through the mail catcher', async ({ emailSettings }) => {
  await emailSettings.open();
  await emailSettings.useServer({ host: MAIL_SMTP_HOST, port: MAIL_SMTP_PORT });
  await emailSettings.save();
});

// ---- the email settings -------------------------------------------------------------------

When(
  'I save the mail server {string} on port {string} with the user name {string} and TLS switched on',
  async ({ emailSettings }, host: string, port: string, username: string) => {
    await emailSettings.open();
    await emailSettings.useServer({ host, port, username, password: 'secret', tls: true });
    await emailSettings.save();
  },
);

Then(
  'the email settings show the mail server {string} on port {string} with the user name {string} and TLS switched on',
  async ({ emailSettings }, host: string, port: string, username: string) => {
    await emailSettings.open();
    expect(await emailSettings.current()).toMatchObject({ useDefault: false, host, port, username, tls: true, ssl: false });
  },
);

When('I save the default From address {string}', async ({ emailSettings, names }, address: string) => {
  await emailSettings.open();
  await emailSettings.setFromAddress(names.fill(address));
  await emailSettings.save();
});

When('I test the email settings of the mail server {string} on port {string}', async ({ emailSettings }, host: string, port: string) => {
  await emailSettings.open();
  await emailSettings.useServer({ host, port });
  await emailSettings.testConnection();
});

When('I test the email settings', async ({ emailSettings }) => {
  await emailSettings.open();
  await emailSettings.testConnection();
});

Then('the test of the email settings says {string}', async ({ emailSettings }, text: string) => {
  expect(emailSettings.lastTestResult).toContain(text);
});

// ---- form notifications ------------------------------------------------------------------

When('I send the responses of the form to {string}', async ({ formBuilder, names }, addresses: string) => {
  await formBuilder.setNotificationEmail(names.fill(addresses));
});

When('I set the subject of the notification email to {string}', async ({ formBuilder, names }, subject: string) => {
  await formBuilder.setNotificationHeaders({ subject: names.fill(subject) });
});

When('I set the reply-to address of the notification email to {string}', async ({ formBuilder, names }, address: string) => {
  await formBuilder.setNotificationHeaders({ replyTo: names.fill(address) });
});

// ---- the emails that arrived ------------------------------------------------------------------

Then('{int} email(s) arrive(s)', async ({ mail }, count: number) => {
  const mails = await mail.waitForMessages(count);
  expect(mails).toHaveLength(count);
});

Then('no email is sent', async ({ mail }) => {
  await mail.expectNoMessages();
});

Then('the email is addressed to {string}', async ({ mail, names }, addresses: string) => {
  const [message] = await mail.waitForMessages(1);
  for (const address of addresses.split(',').map((a) => names.fill(a.trim()))) expect(message.to).toContain(address);
});

Then('the email comes from {string}', async ({ mail, names }, address: string) => {
  const [message] = await mail.waitForMessages(1);
  expect(message.from).toBe(names.fill(address));
});

Then('the email subject is {string}', async ({ mail, names }, subject: string) => {
  const [message] = await mail.waitForMessages(1);
  expect(message.subject).toBe(names.fill(subject));
});

Then('the email subject is the title of the form {string}', async ({ mail, names }, form: string) => {
  const [message] = await mail.waitForMessages(1);
  expect(message.subject).toBe(names.resolve(form));
});

Then('the email has the reply-to address {string}', async ({ mail, names }, address: string) => {
  const [message] = await mail.waitForMessages(1);
  expect(message.replyTo).toContain(names.fill(address));
});

Then('the text of the email contains {string}', async ({ mail }, text: string) => {
  const [message] = await mail.waitForMessages(1);
  expect(message.text).toContain(text);
  expect(message.html).toContain(text);
});

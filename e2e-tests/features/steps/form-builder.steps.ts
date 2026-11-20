import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DataTable } from 'playwright-bdd';
import { Given, Then, When } from '../support/fixtures';
import { FieldSpec, fieldNameOf } from '../support/pages/form-builder-page';

const labels = (list: string) => list.split(',').map((s) => s.trim()).filter(Boolean);

// ---- building a form ---------------------------------------------------------

When('I start a new form titled {string}', async ({ formBuilder, names }, name: string) => {
  await formBuilder.openNew();
  await formBuilder.setTitle(names.unique(name));
});

// Columns: Type, Label, and as needed Choices, Required, Validation, Regex, Message.
When('I add these fields to the form:', async ({ formBuilder }, table: DataTable) => {
  for (const row of table.hashes()) {
    const spec: FieldSpec = {
      type: row.Type,
      label: row.Label,
      options: row.Choices ? labels(row.Choices) : undefined,
      required: row.Required === 'yes',
      validation: (row.Validation || undefined) as FieldSpec['validation'],
      regex: row.Regex || undefined,
      message: row.Message || undefined,
    };
    await formBuilder.addField(spec);
  }
});

When('I set the form\'s submit button label to {string}', async ({ formBuilder }, label: string) => {
  await formBuilder.setSubmitLabel(label);
});

When('I set the form\'s confirmation message to {string}', async ({ formBuilder }, message: string) => {
  await formBuilder.setConfirmationMessage(message);
});

When('I publish the form', async ({ formBuilder }) => {
  await formBuilder.publish();
});

// Shows the form on a public page, with the Form display object of the layout manager.
When(
  'I show the form {string} on a new page {string}',
  async ({ contentEdit, layout, page, forms, names }, formName: string, pageName: string) => {
    const pageTitle = names.unique(pageName);
    await contentEdit.createAndPublishPage(pageTitle);
    await layout.startInlineEditing(pageTitle);
    await layout.addObject('Form');
    await layout.setForm(names.resolve(formName));
    await layout.publish();
    forms.setId(formName, await page.locator('form.mura-form input[name=formid]').inputValue());
    forms.pages.set(formName, pageTitle);
  },
);

// A form of text fields, published and shown on a page, as the starting point of the response scenarios.
Given(
  'a form {string} is on the page {string} with the fields {string}',
  async ({ formBuilder, contentEdit, layout, page, forms, names }, formName: string, pageName: string, list: string) => {
    await formBuilder.openNew();
    await formBuilder.setTitle(names.unique(formName));
    for (const label of labels(list)) await formBuilder.addField({ type: 'Text field', label });
    await formBuilder.publish();
    const pageTitle = names.unique(pageName);
    await contentEdit.createAndPublishPage(pageTitle);
    await layout.startInlineEditing(pageTitle);
    await layout.addObject('Form');
    await layout.setForm(names.resolve(formName));
    await layout.publish();
    forms.setId(formName, await page.locator('form.mura-form input[name=formid]').inputValue());
    forms.pages.set(formName, pageTitle);
  },
);

// One submission per row; the columns are the labels of the form's fields.
Given(
  'visitors have submitted the form {string} with:',
  async ({ visitorForm, forms }, formName: string, table: DataTable) => {
    for (const row of table.hashes()) {
      await visitorForm.open(forms.pages.get(formName)!);
      for (const [label, value] of Object.entries(row)) await visitorForm.fill(label, value);
      await visitorForm.submit();
      await visitorForm.expectSubmitted();
    }
  },
);

// ---- the visitor's view --------------------------------------------------------

When('a visitor opens the page {string}', async ({ visitorForm, names }, pageName: string) => {
  await visitorForm.open(names.resolve(pageName));
});

Then('the form shows the fields {string}', async ({ visitorForm }, list: string) => {
  await visitorForm.expectFields(labels(list));
});

Then('the field {string} is marked as required', async ({ visitorForm }, label: string) => {
  await visitorForm.expectRequired(label);
});

Then('the field {string} offers the choices {string}', async ({ visitorForm }, label: string, list: string) => {
  await visitorForm.expectChoices(label, labels(list));
});

Then('the form has a submit button labelled {string}', async ({ visitorForm }, label: string) => {
  await visitorForm.expectSubmitLabel(label);
});

// Rows: field label, value. Choices of a checkbox field are comma separated; a file field names a file in fixtures/.
When('the visitor fills in the form with:', async ({ visitorForm }, table: DataTable) => {
  for (const [label, value] of Object.entries(table.rowsHash())) await visitorForm.fill(label, value);
});

When('the visitor fills in {string} with {int} characters', async ({ visitorForm }, label: string, length: number) => {
  await visitorForm.fill(label, 'x'.repeat(length));
});

When('the visitor submits the form', async ({ visitorForm }) => {
  await visitorForm.submit();
});

Then('the form is accepted', async ({ visitorForm }) => {
  await visitorForm.expectSubmitted();
});

Then('the form is accepted with the message {string}', async ({ visitorForm }, message: string) => {
  await visitorForm.expectSubmitted(message);
});

Then('the form is not accepted', async ({ visitorForm }) => {
  await visitorForm.expectStillShowingForm();
});

Then('the form reports {string}', async ({ visitorForm }, message: string) => {
  await visitorForm.expectError(message);
});

Then('the form does not report {string}', async ({ visitorForm }, message: string) => {
  await visitorForm.expectNoErrorFor(message);
});

// ---- the responses in the admin ------------------------------------------------

Then('the form {string} has {int} response(s) in the admin', async ({ formData, forms }, name: string, count: number) => {
  await formData.open(forms.idOf(name));
  await formData.expectTotal(count);
});

// The columns of the table are field labels; each row must match a stored response.
Then('the responses of the form {string} include:', async ({ formData, forms }, name: string, table: DataTable) => {
  await formData.list(forms.idOf(name));
  const stored = await formData.responses();
  for (const expected of table.hashes()) {
    // The admin shows the field names with a capital letter ("Yourname"), so names are compared in lower case.
    const found = stored.some((response) => {
      const byName = Object.fromEntries(Object.entries(response).map(([k, v]) => [k.toLowerCase(), v]));
      return Object.entries(expected).every(([label, value]) => byName[fieldNameOf(label)] === value);
    });
    expect(found, `a response with ${JSON.stringify(expected)} in ${JSON.stringify(stored)}`).toBe(true);
  }
});

Then(
  'listing the responses of {string} with {string} matching {string} shows {int} response(s)',
  async ({ formData, forms }, name: string, label: string, keywords: string, count: number) => {
    await formData.list(forms.idOf(name), { field: fieldNameOf(label), keywords });
    expect(await formData.responses()).toHaveLength(count);
  },
);

When('I delete the response containing {string} from the form {string}', async ({ formData, forms }, value: string, name: string) => {
  await formData.list(forms.idOf(name));
  await formData.deleteResponseWith(value);
});

Then('the CSV download of the form {string} contains {string}', async ({ formData, forms }, name: string, text: string) => {
  await formData.open(forms.idOf(name));
  expect(await formData.downloadCsv()).toContain(text);
});

// The response's "View" link must serve the very file the visitor uploaded.
Then(
  'the response containing {string} in the form {string} links to the uploaded file {string}',
  async ({ formData, forms }, value: string, name: string, file: string) => {
    await formData.list(forms.idOf(name));
    const served = await formData.attachmentOf(value);
    expect(served.equals(readFileSync(join(__dirname, '../../fixtures', file)))).toBe(true);
  },
);

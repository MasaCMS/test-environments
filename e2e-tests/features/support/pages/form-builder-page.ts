import { expect, Page } from '@playwright/test';

export const FORMS_MODULE = '00000000000000000000000000000000004';

// The builder's toolbar buttons, by the kind of field they add.
const FIELD_BUTTONS: Record<string, string> = {
  'Text field': 'textfield',
  'Text area': 'textarea',
  'Hidden field': 'hidden',
  'Radio buttons': 'radio',
  Checkboxes: 'checkbox',
  Dropdown: 'dropdown',
  'File upload': 'file',
};

export interface FieldSpec {
  type: string;
  label: string;
  /** Choices for radio buttons, checkboxes and dropdowns. */
  options?: string[];
  required?: boolean;
  validation?: 'Numeric' | 'Date' | 'Email' | 'Regex';
  regex?: string;
  message?: string;
}

/** The form name Masa gives a field: its label without spaces and punctuation, in lower case. */
export function fieldNameOf(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9_]/g, '');
}

/** The Form Builder in the admin (Content > Forms > Add Form). */
export class FormBuilderPage {
  constructor(private readonly page: Page) {}

  private get field() {
    return this.page.locator('#mura-tb-field');
  }

  async openNew() {
    await this.page.goto(
      `/admin/?muraAction=cArch.edit&type=Form&subtype=Default&siteid=default&moduleid=${FORMS_MODULE}` +
        `&parentid=00000000000000000000000000000000001&contentid=&startrow=1`,
    );
    await this.page.locator('#button-textfield').waitFor();
    // The builder attaches its behaviour a moment after the toolbar shows.
    await this.page.waitForTimeout(1_500);
  }

  async setTitle(title: string) {
    await this.page.locator('#mura-content-title-render').click();
    await this.page.keyboard.type(title);
  }

  /** The builder only notices typing, so text is typed key by key. */
  private async type(locator: ReturnType<Page['locator']>, text: string) {
    await locator.fill('');
    await locator.pressSequentially(text);
  }

  async addField(spec: FieldSpec) {
    const button = FIELD_BUTTONS[spec.type];
    if (!button) throw new Error(`Unknown field type "${spec.type}"`);
    // Wait for the new field to be in the list; selecting too early selects the previous field of that type.
    const blocks = this.page.locator(`#mura-tb-fields li.field-${button} .mura-tb-block`);
    const before = await blocks.count();
    await this.page.locator(`#button-${button}`).click();
    await expect(blocks).toHaveCount(before + 1);
    await blocks.last().click();
    await this.type(this.field.locator('input[name=label]'), spec.label);

    if (spec.options) await this.addOptions(spec.options);

    if (spec.required || spec.validation || spec.message) {
      await this.field.locator('a', { hasText: 'Validation' }).first().click();
      if (spec.validation) await this.field.locator('select[name=validatetype]').selectOption({ label: spec.validation });
      if (spec.regex) await this.type(this.field.locator('input[name=validateregex]'), spec.regex);
      if (spec.message) await this.type(this.field.locator('input[name=validatemessage]'), spec.message);
      if (spec.required) {
        // Masa styles the checkbox; clicking the input itself in the page is the reliable way.
        const required = this.field.locator('input[name=isrequired]');
        if (!(await required.isChecked())) await required.evaluate((el: HTMLInputElement) => el.click());
        await expect(required).toBeChecked();
      }
    }
    // The label shows in the list of fields once the builder has taken the field over.
    await expect(this.page.locator('#mura-tb-fields li', { hasText: spec.label }).last()).toBeVisible();
  }

  /** Lists the choices of the selected radio, checkbox or dropdown field. Label and value are the same. */
  private async addOptions(options: string[]) {
    // A new choice list has no source yet; "Create New" means: type the choices in.
    await this.page.locator('#mura-tb-dataset-sourcetype').selectOption('entered');
    await this.page.locator('#mura-tb-dataset-form').getByRole('button', { name: 'Update' }).click();
    for (const option of options) {
      await this.page.getByText('Add Option').click();
      const row = this.page.locator('#mura-tb-grid-table li').last();
      await this.type(row.locator('input[name=label]'), option);
      await this.type(row.locator('input[name=value]'), option);
    }
  }

  /** The "Form" settings of the builder: the label of the submit button. */
  async setSubmitLabel(label: string) {
    await this.page.locator('#button-form').click();
    await this.type(this.page.locator('#mura-tb-fields-settings input[name=submitlabel]'), label);
  }

  /** The message that replaces the form after a submission. */
  async setConfirmationMessage(message: string) {
    await this.page.getByText('Basic', { exact: true }).first().click();
    await this.page.locator('textarea[name=responseMessage]').fill(message);
  }

  /** The "Form" settings of the builder: subject and reply-to address of the notification email. */
  async setNotificationHeaders(headers: { subject?: string; replyTo?: string }) {
    await this.page.locator('#button-form').click();
    // The builder takes a value over when the box loses focus.
    for (const [name, value] of [['emailsubject', headers.subject], ['replyto', headers.replyTo]] as const) {
      if (!value) continue;
      const box = this.page.locator(`#mura-tb-fields-settings input[name=${name}]`);
      await this.type(box, value);
      await box.blur();
    }
  }

  async setNotificationEmail(address: string) {
    await this.page.getByText('Basic', { exact: true }).first().click();
    await this.page.locator('input[name=responseSendTo]').fill(address);
  }

  async publish() {
    await this.page.locator('button.mura-primary', { hasText: 'Publish' }).click();
    await expect(this.page).toHaveURL(/cArch\.list/);
  }

  /** Shows the names of the fields in the order the builder lists them. */
  async listedFields(): Promise<string[]> {
    const names = await this.page.locator('#mura-tb-fields li .mura-tb-block span').allInnerTexts();
    return names.map((n) => n.trim());
  }
}

import { APIRequestContext, expect, Page } from '@playwright/test';
import { HOME_CONTENT_ID, SITE_ID } from '../../../lib/helpers';

export const API_BASE = `/index.cfm/_api/json/v1/${SITE_ID}`;

/**
 * Masa's JSON API as a browser client uses it: the Mura.js library on a public page, signed in
 * with the session of the logged-in user. Plain HTTP calls cover what needs no session.
 */
export class RestApiPage {
  response?: { status: number; body: any };
  contentIds = new Map<string, string>();
  lastLogin?: string;
  lastSaveErrors?: unknown;
  saveRefused = false;

  constructor(
    private readonly page: Page,
    private readonly request: APIRequestContext,
  ) {}

  /** Opens a public page so that the Mura.js client is available. */
  async start() {
    await this.page.goto('/index.cfm/');
    await this.page.waitForFunction(() => typeof (window as any).Mura?.getEntity === 'function');
  }

  async login(username: string, password: string) {
    this.lastLogin = await this.page.evaluate(
      async ([u, p]) => {
        try {
          const result = await (window as any).Mura.login(u, p);
          return String(result?.status ?? JSON.stringify(result));
        } catch (error) {
          return `error: ${error}`;
        }
      },
      [username, password],
    );
  }

  async get(path: string) {
    const response = await this.request.get(`${API_BASE}${path}`);
    this.response = { status: response.status(), body: await response.json().catch(() => undefined) };
  }

  async createPage(label: string, title: string) {
    const saved = await this.page.evaluate(
      async ([t, parent]) => {
        try {
          const entity = await (window as any).Mura
            .getEntity('content')
            .set({ title: t, type: 'Page', subtype: 'Default', parentid: parent, approved: 1, body: '<p>Made through the API</p>' })
            .save();
          return { id: entity.get('contentid'), errors: entity.get('errors'), refused: false };
        } catch {
          // The API answers a request it does not allow with an error.
          return { id: '', errors: {}, refused: true };
        }
      },
      [title, HOME_CONTENT_ID],
    );
    this.lastSaveErrors = saved.errors;
    this.saveRefused = saved.refused;
    if (saved.id && !Object.keys(saved.errors ?? {}).length) this.contentIds.set(label, saved.id);
  }

  idOf(label: string): string {
    const id = this.contentIds.get(label);
    if (!id) throw new Error(`The page "${label}" was not created through the API in this scenario`);
    return id;
  }

  async rename(label: string, title: string) {
    await this.page.evaluate(
      async ([id, t]) => {
        const entity = await (window as any).Mura.getEntity('content').loadBy({ contentid: id });
        await entity.set('title', t).save();
      },
      [this.idOf(label), title],
    );
  }

  async remove(label: string) {
    await this.page.evaluate(async (id) => {
      const entity = await (window as any).Mura.getEntity('content').loadBy({ contentid: id });
      await entity.delete();
    }, this.idOf(label));
  }

  /** The titles of the content the API finds with this exact title. */
  async titlesFound(title: string): Promise<string[]> {
    return this.page.evaluate(async (t) => {
      const feed = await (window as any).Mura.getFeed('content').where().prop('title').isEQ(t).getQuery();
      return feed.get('items').map((item: any) => item.get('title'));
    }, title);
  }

  expectStatus(status: number) {
    expect(this.response?.status).toBe(status);
  }

  expectJson() {
    expect(this.response?.body, 'the response is JSON').toBeTruthy();
  }
}

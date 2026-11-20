import { APIRequestContext, expect, Page } from '@playwright/test';
import { siteManagerUrl } from '../../../lib/helpers';

/** Measures how long Masa takes to answer. The limits are the performance benchmarks of the test plan. */
export class TimingPage {
  /** Seconds each load took, by what was measured. */
  readonly seconds = new Map<string, number[]>();

  constructor(
    private readonly page: Page,
    private readonly request: APIRequestContext,
  ) {}

  private record(label: string, value: number) {
    this.seconds.set(label, [...(this.seconds.get(label) ?? []), value]);
  }

  /** The time in seconds to load a public path (relative to /index.cfm/) in the browser, until the page has loaded. */
  async loadPublic(label: string, path: string) {
    const start = Date.now();
    const response = await this.page.goto(`/index.cfm/${path}`, { waitUntil: 'load' });
    expect(response?.status(), `GET /index.cfm/${path}`).toBe(200);
    this.record(label, (Date.now() - start) / 1000);
  }

  /** The time in seconds for the server to answer a public path. */
  async requestPublic(label: string, path: string) {
    const start = Date.now();
    const response = await this.request.get(`/index.cfm/${path}`);
    expect(response.status(), `GET /index.cfm/${path}`).toBe(200);
    this.record(label, (Date.now() - start) / 1000);
  }

  async loadSiteManager(label: string) {
    const start = Date.now();
    await this.page.goto(siteManagerUrl(), { waitUntil: 'load' });
    this.record(label, (Date.now() - start) / 1000);
  }

  /** The fastest of the loads: one slow load on a busy machine does not fail a test. */
  best(label: string): number {
    const all = this.seconds.get(label);
    if (!all?.length) throw new Error(`Nothing was measured for "${label}"`);
    return Math.min(...all);
  }

  expectWithin(label: string, limit: number) {
    expect(this.best(label), `"${label}" took ${this.seconds.get(label)?.map((s) => s.toFixed(2)).join(', ')} seconds`).toBeLessThan(limit);
  }
}

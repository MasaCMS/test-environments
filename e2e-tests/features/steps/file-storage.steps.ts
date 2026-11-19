import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fixturePath, rawGet, readCacheFile, sha256 } from '../../lib/masa-files';
import { Given, Then, When } from '../support/fixtures';
import { slugOf } from '../support/pages/public-site-page';

const SITE_ASSET_URL = '/index.cfm/sites/default';

// ---- publishing ------------------------------------------------------------

When(
  'I publish a page titled {string} with the primary image {string}',
  async ({ contentEdit, names, uploads }, name: string, file: string) => {
    uploads.snapshot();
    await contentEdit.createAndPublish(names.unique(name), { file: fixturePath(file) });
    uploads.detect(fixturePath(file));
  },
);
Given(
  'a page titled {string} with the primary image {string} is published',
  async ({ contentEdit, names, uploads }, name: string, file: string) => {
    uploads.snapshot();
    await contentEdit.createAndPublish(names.unique(name), { file: fixturePath(file) });
    uploads.detect(fixturePath(file));
  },
);

When(
  'I publish a file item titled {string} with the file {string}',
  async ({ contentEdit, names, uploads }, name: string, file: string) => {
    uploads.snapshot();
    await contentEdit.createAndPublish(names.unique(name), { type: 'File', file: fixturePath(file) });
    uploads.detect(fixturePath(file));
  },
);

// ---- file cache --------------------------------------------------------------

Then('the file cache holds the image with its small, medium and source variants', async ({ uploads }) => {
  const files = uploads.cacheFiles;
  for (const name of [`${uploads.id}.${uploads.extension}`, uploads.variant('small'), uploads.variant('medium'), uploads.variant('source')]) {
    expect(files, `cache files for ${uploads.id}`).toContain(name);
  }
});

Then('the file cache holds only the original file', async ({ uploads }) => {
  expect(uploads.cacheFiles).toEqual([`${uploads.id}.${uploads.extension}`]);
});

Then('the cached source is identical to the uploaded file', async ({ uploads }) => {
  const original = readFileSync(uploads.originalPath!);
  expect(sha256(readCacheFile(uploads.variant('source')))).toBe(sha256(original));
});

Then('the file cache holds no files for the upload', async ({ uploads }) => {
  expect(uploads.cacheFiles).toEqual([]);
});

Then('the file cache still holds the upload', async ({ uploads }) => {
  expect(uploads.cacheFiles).toContain(`${uploads.id}.${uploads.extension}`);
});

// ---- public site ---------------------------------------------------------------

Then('the page {string} shows the uploaded image', async ({ publicSite, names, uploads }, name: string) => {
  await publicSite.expectImageShown(names.resolve(name), uploads.id);
});

Then('the page {string} serves the uploaded file', async ({ request, names, uploads }, name: string) => {
  const response = await request.get(`/index.cfm/${slugOf(names.resolve(name))}/`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect(sha256(await response.body())).toBe(sha256(readFileSync(uploads.originalPath!)));
});

Then('the page {string} is no longer on the public site', async ({ publicSite, names }, name: string) => {
  await publicSite.expectPageGone(names.resolve(name));
});

// ---- render API and asset route --------------------------------------------------

Then('the render API serves the file inline as an image', async ({ request, uploads }) => {
  const response = await request.get(`/index.cfm/_api/render/file/?fileID=${uploads.id}`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^image\//);
  expect(response.headers()['content-disposition']).toMatch(/^inline/);
});

Then('the render API serves the file as a download with method attachment', async ({ request, uploads }) => {
  const response = await request.get(`/index.cfm/_api/render/file/?fileID=${uploads.id}&method=attachment`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-disposition']).toMatch(/^attachment/);
});

Then('the render API serves the source size byte for byte', async ({ request, uploads }) => {
  const response = await request.get(`/index.cfm/_api/render/file/?fileID=${uploads.id}&size=source`);
  expect(response.status()).toBe(200);
  expect(sha256(await response.body())).toBe(sha256(readFileSync(uploads.originalPath!)));
});

Then('Masa streams the cached original inline with the right type', async ({ request, uploads }) => {
  const response = await request.get(`${SITE_ASSET_URL}/cache/file/${uploads.id}.${uploads.extension}`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^image\//);
  expect(response.headers()['content-disposition'] ?? 'inline').toMatch(/^inline/);
  expect(sha256(await response.body())).toBe(sha256(readFileSync(uploads.originalPath!)));
});

Then('Masa streams the cached original as a download with method attachment', async ({ request, uploads }) => {
  const response = await request.get(`${SITE_ASSET_URL}/cache/file/${uploads.id}.${uploads.extension}?method=attachment`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-disposition']).toMatch(/^attachment/);
});

Then('a request for a missing asset is answered with a 404', async ({ request }) => {
  const response = await request.get(`${SITE_ASSET_URL}/assets/does-not-exist-${Date.now()}.jpg`);
  expect(response.status()).toBe(404);
});

// ---- path traversal --------------------------------------------------------------

// Never the file: the response must not be the settings file, whatever status the
// container or Masa picks (a 400 from the container, or Masa's 404 page).
Then(
  'the traversal request {string} is not served the settings file',
  async ({ request, baseURL }, rawPath: string) => {
    const first = await rawGet(baseURL!, rawPath);
    let { status, body } = first;
    const location = first.headers.location;
    if (status >= 300 && status < 400 && location) {
      const followed = await request.get(location);
      status = followed.status();
      body = await followed.body();
    }
    expect(status, `status for ${rawPath}`).not.toBe(200);
    expect(body.toString('utf8')).not.toMatch(/appreloadkey|\[settings\]/i);
  },
);

// ---- delete, trash, restore --------------------------------------------------------

When('I delete the page {string}', async ({ siteManager, names }, name: string) => {
  await siteManager.deleteContent(names.resolve(name));
});

When('I restore the page {string} from the trash', async ({ trash, names }, name: string) => {
  await trash.restore(names.resolve(name));
});

When('I empty the trash', async ({ trash }) => {
  await trash.empty();
});

Then('the page {string} is in the trash', async ({ trash, names }, name: string) => {
  await trash.expectContains(names.resolve(name));
});

Then('the uploaded image is still served', async ({ request, uploads }) => {
  const response = await request.get(`/sites/default/cache/file/${uploads.id}.${uploads.extension}`);
  expect(response.status()).toBe(200);
  expect(sha256(await response.body())).toBe(sha256(readFileSync(uploads.originalPath!)));
});

// ---- startup ---------------------------------------------------------------------------

When('I reload the application', async ({ request }) => {
  const response = await request.get('/?appreload=appreload', { timeout: 120_000 });
  expect(response.status()).toBe(200);
});

import { Then, When } from '../support/fixtures';
import { slugOf } from '../support/pages/public-site-page';

When('I load the home page {int} times', async ({ timing }, times: number) => {
  for (let i = 0; i < times; i++) await timing.loadPublic('home page', '');
});

When('I load the page {string} {int} times', async ({ timing, names }, name: string, times: number) => {
  for (let i = 0; i < times; i++) await timing.loadPublic(name, `${slugOf(names.resolve(name))}/`);
});

When('I load the Site Manager {int} times', async ({ timing }, times: number) => {
  for (let i = 0; i < times; i++) await timing.loadSiteManager('Site Manager');
});

When('I ask the server for the home page {int} times', async ({ timing }, times: number) => {
  for (let i = 0; i < times; i++) await timing.requestPublic('home page request', '');
});

Then('the fastest {string} takes less than {int} seconds', async ({ timing }, label: string, limit: number) => {
  timing.expectWithin(label, limit);
});

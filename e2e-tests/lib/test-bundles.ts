import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { masaDir } from './masa-files';
import { installTestTheme, TEST_THEME } from './test-theme';

/** What the test theme's resource bundles say. The Dutch bundle has no "onlyenglish" key. */
export const BUNDLE_TEXT = {
  greetingEnglish: 'Hello from the English bundle',
  greetingDutch: 'Hallo uit het Nederlandse bundel',
  onlyEnglish: 'Only in the English bundle',
};

/**
 * The test theme (see test-theme.ts) with resource bundles of its own, as a theme developer writes them:
 * `resource_bundles/en.properties` and `nl.properties` inside the theme folder. The theme's footer shows
 * three keys, so the page shows which bundle answered. Like the other theme tests this writes into the
 * bind-mounted Masa folder (MASA_DIR), so it only works against a local environment.
 */
export function installBundleTheme() {
  installTestTheme();
  const theme = path.join(masaDir(), 'themes', TEST_THEME);
  mkdirSync(path.join(theme, 'resource_bundles'), { recursive: true });
  writeFileSync(
    path.join(theme, 'resource_bundles', 'en.properties'),
    `e2e.greeting=${BUNDLE_TEXT.greetingEnglish}\ne2e.onlyenglish=${BUNDLE_TEXT.onlyEnglish}\n`,
  );
  writeFileSync(path.join(theme, 'resource_bundles', 'nl.properties'), `e2e.greeting=${BUNDLE_TEXT.greetingDutch}\n`);
  appendFileSync(
    path.join(theme, 'templates/inc/html_foot.cfm'),
    `<cfoutput>
<div id="e2e-rb-greeting">#$.rbKey('e2e.greeting')#</div>
<div id="e2e-rb-onlyenglish">#$.rbKey('e2e.onlyenglish')#</div>
<div id="e2e-rb-missing">#$.rbKey('e2e.nosuchkey')#</div>
</cfoutput>
`,
  );
}

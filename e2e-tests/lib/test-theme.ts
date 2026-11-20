import { appendFileSync, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { masaDir } from './masa-files';

export const TEST_THEME = 'e2etheme';
/** Marker the test theme adds to every page it renders. */
export const THEME_MARKER = 'E2E theme active';
/** The template only the test theme has, and the text its pages show. */
export const CUSTOM_TEMPLATE = 'e2e_landing';
export const CUSTOM_TEMPLATE_MARKER = 'E2E landing template';

const themesDir = () => path.join(masaDir(), 'themes');

/**
 * Installs the test theme the way an administrator does by hand: a theme is a folder in /themes.
 * It is a copy of the default theme with a marker in every page and one extra template.
 * Like the file storage tests, this writes into the bind-mounted Masa folder (MASA_DIR),
 * so it only works against a local environment.
 */
export function installTestTheme() {
  const target = path.join(themesDir(), TEST_THEME);
  rmSync(target, { recursive: true, force: true });
  cpSync(path.join(themesDir(), 'default'), target, {
    recursive: true,
    filter: (source) => !/node_modules|\.git/.test(source),
  });
  appendFileSync(
    path.join(target, 'templates/inc/html_foot.cfm'),
    `<cfoutput><div id="e2e-theme-marker">${THEME_MARKER}</div></cfoutput>\n`,
  );
  writeFileSync(
    path.join(target, 'templates', `${CUSTOM_TEMPLATE}.cfm`),
    `<cfoutput>
<!DOCTYPE html>
<html lang="en">
	<cfinclude template="inc/html_head.cfm" />
	<body id="#$.getTopID()#">
		<main id="e2e-landing-template">
			<h1>${CUSTOM_TEMPLATE_MARKER}</h1>
			#$.dspBody(body=$.content('body'), pageTitle='', crumbList=false, showMetaImage=false)#
		</main>
		<cfinclude template="inc/html_foot.cfm" />
	</body>
</html>
</cfoutput>
`,
  );
}

/** Adds a rule to the test theme's stylesheet, as an administrator editing the theme's CSS does. */
export function appendThemeCss(rule: string) {
  appendFileSync(path.join(themesDir(), TEST_THEME, 'assets/css/styles.min.css'), `\n${rule}\n`);
}

export function removeTestTheme() {
  rmSync(path.join(themesDir(), TEST_THEME), { recursive: true, force: true });
}

export function testThemeInstalled(): boolean {
  return existsSync(path.join(themesDir(), TEST_THEME, 'templates'));
}

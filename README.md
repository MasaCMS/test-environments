# Masa CMS test environments

These are test environments for Masa CMS.

## Quick Start with Makefile

The easiest way to start a test environment is using the Makefile:

## Requirements

* GIT
* Docker
* Docker compose
* Commandbox CLI

## Setup

* Clone Masa CMS into this project: `git clone git@github.com:MasaCMS/MasaCMS.git masacms`

## Start environment

### Option 1: Using Makefile interactively (Recommended)

Simply run `make` to get an interactive menu:

```bash
$ make
╔════════════════════════════════════════╗
║  MasaCMS Test Environment Setup        ║
╔════════════════════════════════════════╗

Select Database:
  1) MySQL
  2) MariaDB
  3) PostgreSQL
  4) MSSQL

Enter database choice (1-4): 1

Select ColdFusion Engine:
  1) Lucee
  2) BoxLang
  3) Adobe ColdFusion

Enter engine choice (1-3): 3

Select Adobe ColdFusion Version:
  1) ColdFusion 2021
  2) ColdFusion 2023
  3) ColdFusion 2025
  4) Latest

Enter version choice (1-4): 3

Starting mysql database and Adobe ColdFusion cf25...
✓ MySQL is running on port 3306
✓ Adobe ColdFusion cf25 is running on http://localhost:18081
```

When you select Lucee you are prompted for a version as well:

```
Select Lucee Version:
  1) Lucee 6.2
  2) Lucee 7.1
  3) Lucee 8.0
  4) Latest

Enter version choice (1-4): 3

Starting mysql database and Lucee 8.0...
```

**Note:** When selecting Adobe ColdFusion or Lucee, you'll be prompted to choose a version.
This does not apply to the BoxLang engine.

###  Option 2: Using Makefile Direct Commands

#### Starting Environments

Start a specific database + CF engine combination:

```bash
# Lucee combinations
make lucee-mysql
make lucee-mariadb
make lucee-postgres
make lucee-mssql

# Lucee with specific version
make lucee-mysql LUCEE_VERSION=6.2      # Lucee 6.2
make lucee-mysql LUCEE_VERSION=7.1      # Lucee 7.1
make lucee-mysql LUCEE_VERSION=8.0      # Lucee 8.0
make lucee-mysql LUCEE_VERSION=latest   # Latest version (default)

# BoxLang combinations
make boxlang-mysql
make boxlang-mariadb
make boxlang-postgres
make boxlang-mssql

# Adobe ColdFusion combinations
make adobe-mysql
make adobe-mariadb
make adobe-postgres
make adobe-mssql

# Adobe with specific version
make adobe-mysql CF_VERSION=cf21      # ColdFusion 2021
make adobe-mysql CF_VERSION=cf23      # ColdFusion 2023 (default)
make adobe-mysql CF_VERSION=cf25      # ColdFusion 2025
make adobe-mysql CF_VERSION=latest    # Latest version
```

#### Starting Database Only

```bash
make mysql      # Port 3306
make mariadb    # Port 3307
make postgres   # Port 5432
make mssql      # Port 1433
```

#### Stopping and Cleaning

```bash
# Stop all running containers (keeps containers)
make stop

# Stop and remove all containers (keeps volumes)
make down

# Remove everything: containers, volumes, and network
make clean
```

#### Examples

```bash
# Start MySQL and Lucee
make lucee-mysql
# Visit http://localhost:18181

# Start MariaDB and Lucee 8.0
make lucee-mariadb LUCEE_VERSION=8.0
# Visit http://localhost:18180

# Start MariaDB and Adobe ColdFusion 2025
make adobe-mariadb CF_VERSION=cf25
# Visit http://localhost:18080

# Start MySQL and Adobe ColdFusion 2021
make adobe-mysql CF_VERSION=cf21
# Visit http://localhost:18081

# Start PostgreSQL and BoxLang
make boxlang-postgres
# Visit http://localhost:18282

# Start MariaDB and Adobe ColdFusion (default: 2023)
make adobe-mariadb
# Visit http://localhost:18080

# When done, stop everything
make down
```

### Option 3: Manual Docker Compose

* Open a terminal
* Navigate to the folder of the desired database (for example: /mariadb/)
* Start the database: `docker compose up -d`
* Navigate to the folder of the desired cfml engine (for example: /lucee/mariadb/)
* Start the cfml engine: `docker compose up -d`
* Open `http://localhost:{portnumber}` in the browser

## Port Reference

##### Lucee Ports
The ports are the same for every Lucee version (`LUCEE_VERSION`).

- MySQL: 18181
- MariaDB: 18180
- PostgreSQL: 18182
- MSSQL: 18183

##### BoxLang Ports
- MySQL: 18281
- MariaDB: 18280
- PostgreSQL: 18282
- MSSQL: 18283

##### Adobe ColdFusion Ports
- MySQL: 18081
- MariaDB: 18080
- PostgreSQL: 18082
- MSSQL: 18083

##### Database Ports
- MySQL: 3306
- MariaDB: 3307
- PostgreSQL: 5432
- MSSQL: 1433

## Troubleshooting

If you encounter issues:

1. **Port conflicts**: Check if ports are already in use
	on unix-based systems:
   ```bash
   lsof -i :3306  # Check MySQL port
   lsof -i :18181 # Check Lucee port
   ```

	on windows-based systems (as Administrator):
   ```bash
   netstat -ab
   ```
   this shows a list of applications and ports used

2. **Network issues**: Recreate the network
   ```bash
   make clean
   make network
   ```

3. **View logs**: Use docker compose logs
   ```bash
   cd lucee/mysql
   docker compose logs -f
   ```

4. **Full cleanup**: Remove everything and start fresh
   ```bash
   make clean
   make lucee-mysql  # Or your preferred combination
   ```
## Run test suite

* Install testbox in Masa CMS: `cd masacms && box install`
* Start the desired environment
* Open `http://localhost/core/tests/runner.cfm` in the browser

## Configuration details

### Masa CMS

* admin username: `admin`
* admin password: `admin`
* reload key: `appreload`

### Adobe ColdFusion

* administrator url: `http://localhost/CFIDE/administrator/index.cfm`
* administrator password: `password`

### Lucee

* administrator url: `http://localhost/lucee/admin/server.cfm`
* administrator password: `password`

### Database

#### MariaDB

* host: `localhost:3307`
* user: `root`
* password: `rootpassword`

#### MySQL

* host: `localhost:3306`
* user: `root`
* password: `rootpassword`

#### PostgreSQL

* host: `localhost:5432`
* user: `root`
* password: `rootpassword`

#### MSSQL

* host: `localhost:1433`
* user: `sa`
* password: `sup3r_passw0rd`


## E2E smoke tests

Everything related to the E2E tests lives in [`e2e-tests/`](e2e-tests/) (its own `package.json`, config, tests and runner script). The Playwright smoke tests are in `e2e-tests/smoke/`. They check the public homepage, admin login, the Site Manager and creating/publishing a page.

### Requirements

```bash
cd e2e-tests
npm install
npx playwright install chromium
```

### Run

Each run starts a **fresh** environment in its own docker compose project (`masae2e-<engine>-<db>`), runs the tests and tears it down (including volumes). Your normal dev environment is not touched, but host ports are shared, so stop it first; the script skips a combination whose ports are in use.

```bash
make e2e ENGINE=lucee DB=mysql          # one combination
make e2e ENGINE=adobe DB=mysql CF_VERSION=cf25
make e2e-all                            # one DB per engine (lucee/mysql, boxlang/postgres, adobe/mssql)
FULL=1 make e2e-all                     # every engine x database
KEEP=1 make e2e ENGINE=lucee DB=mysql   # keep the environment running afterwards
make e2e-report                         # open the most recent HTML report
make e2e-report ENGINE=lucee DB=mysql   # open the report of one combination
```

#### Choosing what to run

`make start` opens an interactive menu: pick "Run E2E tests" to choose the engine (or all), the database (one, one per engine, or all) and the tests (smoke, all features, or specific feature folders), the browser and whether to show it (headed). The same choices are available as options:

| Option | Meaning |
| --- | --- |
| `ENGINE=lucee,boxlang` | Engines to run (comma separated; default: all) |
| `DB=mysql,postgres` | Databases to run (comma separated; default: one per engine, or all with `FULL=1`) |
| `FULL=1` | Every engine x database combination (`make e2e-all`) |
| `PROJECT=smoke,features` | Test projects: `smoke` (default), `features`, or both |
| `FEATURE=forms,security` | Feature folders under `e2e-tests/features/` (`startup` runs `startup.feature`). Implies `PROJECT=features`; unset or `all` runs every feature |
| `LUCEE_VERSION=8.0` | Lucee version for Lucee runs: `6.2`, `7.1`, `8.0` or `latest` (default); asked in the menu when Lucee is included |
| `BROWSER=firefox` | Browser engine: `chromium` (default), `firefox` or `webkit` (install once with `npx playwright install firefox`) |
| `HEADED=1` | Show the browser window (default: headless) |
| `SHOW_REPORT=1` | Open the HTML report of each combination in your browser when the run is done (screenshots and videos work; for the trace viewer use `make e2e-report`) |
| `TAG='@admin'` | Only scenarios with this tag; expressions such as `'@forms and not @wip'` work |

```bash
make e2e ENGINE=lucee DB=mysql,postgres FEATURE=forms,security   # two DBs, two feature folders
make e2e-all FULL=1 PROJECT=features                             # all 12 combinations, all features
make e2e-all ENGINE=lucee,boxlang FEATURE=users                  # one DB per engine, users features
make e2e-features ENGINE=adobe DB=mssql TAG=@admin               # tagged scenarios only
```

A summary table is printed at the end and the exit code is non-zero if any combination fails. Everything a run produces is kept per combination in `e2e-tests/reports/<engine>-<db>/`:

- `html/`: the HTML report (`make e2e-report ENGINE=lucee DB=mysql`), with screenshots, videos and traces attached
- `evidence/`: the same screenshots, videos and traces as plain files, for sharing or attaching to tickets
- `server.log`: the last lines of the container log, for failed combinations

By default only failing tests are captured. Run with `EVIDENCE=1` (for example `make e2e ENGINE=lucee DB=mysql PROJECT=smoke,features EVIDENCE=1`) to capture a screenshot, video and trace of every test as documentation. Add `--headed` to a direct `npx playwright test` run to watch the browser, and set `BROWSER=firefox` or `BROWSER=webkit` to use another browser (install it once with `npx playwright install firefox`).

### Gherkin features

Behavior-level tests are written as Cucumber `.feature` files in `e2e-tests/features/`, run by [playwright-bdd](https://github.com/vitalets/playwright-bdd) on top of Playwright Test. They are a separate Playwright project (`features`) and are **not** part of the default `make e2e` run.

```bash
make e2e-features ENGINE=lucee DB=mysql          # features only
make e2e ENGINE=lucee DB=mysql PROJECT=smoke,features   # both
make e2e-features ENGINE=lucee DB=mysql FEATURE=forms    # selected feature folders only
(cd e2e-tests && npm run test:features)          # against a running environment (BASE_URL)
```

Layout:

```
e2e-tests/
  package.json, playwright.config.ts
  scripts/e2e-matrix.sh  starts each engine/DB, runs the tests, tears down
  smoke/                 smoke specs
  lib/                   shared helpers and global setup (admin login)
  features/
    admin/*.feature      scenarios
    steps/*.steps.ts     step definitions (business language)
    support/fixtures.ts  shared fixtures and Given/When/Then
    support/pages/       page objects: selectors and URLs live here, not in steps
  .features-gen/         generated specs (gitignored, rebuilt by `bddgen`)
```

Conventions:

* Write steps declaratively ("I create and publish a page titled ..."), and keep selectors in page objects.
* Scenarios start logged out. Use `Given I am logged in as an administrator` to reuse the session saved by global setup.
* Use readable names in scenarios. The step layer adds a unique suffix to what it creates (`names.unique("About us")`) and later steps look it up with `names.resolve("About us")`, so reruns against the same environment don't collide. Nothing is cleaned up.
* Steps that check public pages must go through `PublicSitePage`, which fails on CFML engine error output.
* Tags `@admin` / `@anonymous` are descriptive. Tag unstable scenarios `@wip` and exclude them with `(cd e2e-tests && npx playwright test --project=features --grep-invert @wip)`.

### File storage tests

`e2e-tests/features/file-storage/` automates the browser and HTTP parts of the File Storage Service manual test plan (branch `feature/file-storage-service-improvements` of Masa CMS). They are tagged `@file-storage`:

```bash
cd e2e-tests && npx playwright test --project=features --grep @file-storage
```

They read the file cache (`sites/default/cache/file/`) straight from the bind-mounted Masa tree, so they only work against a local environment. Set `MASA_DIR` if your Masa checkout is not at `../masacms`. Test content is not cleaned up, except that the delete scenario empties the **site trash**; use a throwaway environment.

| Manual plan section | Automated |
|---|---|
| 1 Startup | app reload serves the front end without errors (cold start is not covered) |
| 2 Upload, cache, render | JPG/PNG/GIF primary images (cache variants, byte-identical `_source`, shown on the page), PDF File item, render API inline/attachment/`size=source` |
| 4 Delete, restore, purge | delete, still served, restore, delete again, empty trash, every cache file gone |
| 8 Asset route | cache file streamed inline/attachment, missing file 404, five path-traversal variants |

Not automated (manual, or needs test-only code in the Masa tree): custom image sizes and cache maintenance functions (section 2 and 5 need a temporary template), image editor crop/rotate (3), the shared-file and version-restore cases (4), the admin file browser (6), CKEditor (7), the `pooltest` second site, plugin/bundle paths (9), and the S3 removal (10). The temp directory and error log checks are not covered either.

Note: the render API without a size returns a re-encoded `_file` variant, not the original bytes. The tests compare checksums on `size=source` and on the asset route instead.

### Content management tests

`e2e-tests/features/content/` automates the Masa CMS manual test plan, section 2 (Content Management). They run against any Masa version.

| Plan section | Feature | Coverage |
|---|---|---|
| 2.1 Page creation and publishing | `page-publishing.feature` | custom URL title, HTML title and meta description, special characters in the title, very long content (12,000 characters), nested pages, draft then publish, scheduled display date in the future |
| 2.2 Content types | `content-types.feature` | Folder, Calendar, Gallery; Link redirects to its address (File is covered by the file storage tests) |
| 2.3 Rich text editor | `rich-text-editor.feature` | bold, bulleted list, HTML entered in the source view |
| 2.4 Content versioning | `content-versioning.feature` | the history lists the published and archived versions; an archived version is published again |

Not automated from section 2:

- 2.2: Component and Form content have no public page, so they are not checked.
- 2.3: images from the file manager, internal links, tables and pasting from Word.
- 2.4: the side-by-side compare and the `maxArchivedVersions` limit.
- 2.5: the approval workflow needs an Editor role, an approval chain and mail delivery.

### Display objects and layout manager tests

`e2e-tests/features/layout/` automates section 3 of the manual test plan. The tests use the front-end inline editor: they drag display objects from the editor's list into the main content region, publish, and check the public page as a visitor who is not logged in.

| Plan section | Feature | Coverage |
|---|---|---|
| 3.1 Front-end inline editing | `inline-editing.feature` | the editor offers the display objects; adding one by dragging; reordering by dragging one above another; removing one; changes persist after publishing |
| 3.2 Display object types | `display-object-types.feature` | Button, Collection, Container, Call to Action, Embed, Form, Image, Info, Media, Navigation, Site Search and Text are each added and rendered |
| 3.3 Content collections | `collections.feature` | the Collection object's Max Items setting; a collection made in the admin (sorted by title) is chosen as the source and lists its items in that order |

Not automated from section 3: configuring each object's own settings (the objects are tested with default settings), Feed and Calendar objects, plugin display objects, collection filters by content type, category or date range, pagination, and performance with large data sets.

The drag and drop needs a moment after the inline editor opens (the test waits 2.5 seconds) and uses real mouse movements, so these tests need a visible or headless browser, not an API client.

### User management and permissions tests

`e2e-tests/features/users/` automates section 4 of the manual test plan. Users are made in the admin, then log in through a separate browser session, so what they see is what their group permissions allow.

| Plan section | Feature | Coverage |
|---|---|---|
| 4.1 User account management | `user-accounts.feature` | a system user in a group can log in; a system user without permissions has no access to the Site Manager; a site member; special characters in a name; a username can only be used once; an inactive user cannot log in |
| 4.2 Group management | `user-groups.feature`, `user-accounts.feature` | system and member groups are listed; a user in several groups counts as a member of each |
| 4.3 Content permissions | `content-permissions.feature` | Editor permission on one page shows and opens that page only; permissions are inherited by child pages; Deny on a child overrides the inherited permission; the administrator is not limited |

Not automated from section 4: the password reset flow and notification emails (need a mail server), nested groups (the admin has no nested groups), the Author and Read Only permission levels, content shown or hidden on the public site for members (needs the site's extranet setting switched on), and permission overrides by user role at the site level.

### Form Builder tests

`e2e-tests/features/forms/` automates section 5 of the manual test plan. A form is built in the Form Builder, shown on a page with the Form display object, and filled in by a visitor in a separate, logged-out browser session. The responses are then checked in the admin (Form Data).

| Plan section | Feature | Coverage |
|---|---|---|
| 5.1 Form creation | `form-creation.feature` | text field, text area, radio buttons, checkboxes, dropdown and file upload render with their choices and required marker; a submission is stored and the confirmation message shows; several checkboxes at once; a custom submit button label; an uploaded file is stored and served again |
| 5.2 Form response management | `form-responses.feature` | responses are listed, searched by the exact value of a field, exported to CSV and deleted |
| 5.3 Form validation | `form-validation.feature` | required fields (with and without a message of their own), email, numeric, date and regex validation (a number range through a pattern), a 3000 character value, an optional field left empty |

Masa rejects submissions that look like a robot (no mouse movement, no keypress, or sent within moments). The tests move the mouse, press a key and wait 3 seconds before they submit, like a person would.

Not automated from section 5: email notifications (need a mail server), file type restrictions (the builder has no such setting), multi-page forms and form import and export (the Form Data page offers only a CSV download of the responses, no export of the form itself).

### Plugin system tests

`e2e-tests/features/plugins/` automates section 6 of the manual test plan with a small test plugin (`e2e-tests/fixtures/test-plugin/`: a setting, an admin page and one display object). `scripts/build-plugin-fixtures.sh` builds the zips `test-plugin.zip` (version 1.0) and `test-plugin-v2.zip` (version 2.0, whose display object also shows the version); both are committed.

| Plan section | Feature | Coverage |
|---|---|---|
| 6.1 Plugin installation | `plugin-installation.feature` | install by uploading a zip; the plugin is listed with version, provider and category; it is on a site only after it is activated for it; its admin page opens |
| 6.2 Plugin management | `plugin-management.feature` | a changed setting is saved and used; update to a newer version (Update Plugin Version); deactivate and reactivate on a site; uninstall removes the plugin, its entries and its admin page |
| 6.3 Plugin display objects | `plugin-display-objects.feature` | the plugin's display object is added to a page through the Plugin object, shows its setting, follows a changed setting, and a page keeps working after the plugin is uninstalled |

A plugin is installed for the whole CMS. Each scenario removes the test plugin again when it ends, so the other tests see a clean installation.

Not automated from section 6: install via URL (needs a zip on a public address), a plugin with dependencies, display object configurators (the test plugin has none), and clean removal of plugin-specific database tables (the test plugin has none).

### Theme system tests

`e2e-tests/features/themes/` automates section 7 of the manual test plan. The test theme is made by `lib/test-theme.ts`: a copy of the default theme in the `themes` folder of the Masa checkout (`MASA_DIR`), with a marker in every page and one extra template. Like the file storage tests, this writes into the bind-mounted Masa folder, so it only works against a local environment. A scenario that changes the theme sets the default theme again, removes the test theme and reloads the application when it ends.

| Plan section | Feature | Coverage |
|---|---|---|
| 7.1 Theme installation | `theme-installation.feature` | a theme folder is offered in the site settings after an application reload; selecting it applies it to the public site; switching back; the selection survives a reload |
| 7.2 Theme customization | `theme-customization.feature` | a rule added to the theme's stylesheet shows on the site; the site fits a phone-sized screen (no sideways scroll, menu behind a button) and shows the full menu on a desktop screen |
| 7.3 Theme content templates | `theme-templates.feature` | the default templates (two columns, one column, blank) give pages their layout; a page inherits its parent's template; a custom template of the theme can be applied; templates of another theme are not offered |

Not automated from section 7: the theme's own settings screen (the default theme has none), the display regions that a custom template defines, and visual checks of the layout.

### File Manager tests

`e2e-tests/features/file-manager/` automates section 8 of the manual test plan in the File Browser (Content > File Browser). The browser keeps its files between runs and lists 25 per page, so the tests upload files under unique names and find them with the filter.

| Plan section | Feature | Coverage |
|---|---|---|
| 8.1 File upload and management | `file-upload-and-management.feature` | upload of jpg, png, gif, pdf and txt; creating a folder and uploading into it; renaming an image (the extension stays); downloading an image returns the uploaded bytes; deleting an image; editing a text file; filtering the list; browsing Site Files and the Application Root |
| 8.2 Image processing | `image-processing.feature` | an uploaded image shows its dimensions and is served from its address; rotating swaps width and height; resizing |
| 8.3 File browser integration | `file-browser-integration.feature` | an image is inserted into a page and a text is linked to a file through the editor's Browse Server window, and the public page shows them |

Not automated from section 8: file size limits, moving files between folders, and the automatic small, medium and large image sizes (the file storage tests cover those). Non-image files can only be renamed or deleted from the grid view menu, and cannot be selected in the editor's file browser (finding F-30).

### Categories and tags tests

`e2e-tests/features/categories-tags/` automates section 9 of the manual test plan. A category or tag listing belongs to a Folder: the tests publish pages below a folder and open `/<folder>/category/<name>/` and `/<folder>/tag/<name>/`.

| Plan section | Feature | Coverage |
|---|---|---|
| 9.1 Category management | `categories.feature` | creating a category and a nested category; assigning categories to pages (several at once); a folder lists only the pages of a category; changing the categories of a page; deleting a category |
| 9.2 Tag management | `tags.feature` | tagging a page; several tags; a folder lists only the pages of a tag; changing the tags of a page |

Not automated from section 9: category navigation and tag cloud displays, merging duplicate tags (the admin has no tag management) and category display on a page.

### Email tests

`e2e-tests/features/email/` automates section 10 of the manual test plan. The tests need a mail server that keeps what it receives (Mailpit); without it they are skipped.

```
docker compose -f e2e-tests/mail/docker-compose.yml up -d     # SMTP on 1025, web interface on http://localhost:8025
docker compose -f e2e-tests/mail/docker-compose.yml down
```

The CMS container reaches Mailpit as `host.docker.internal` (Docker Desktop). Set `MAIL_SMTP_HOST`, `MAIL_SMTP_PORT` or `MAIL_API` (see `lib/mail-catcher.ts`) for another setup. Scenarios that change the site's email settings put them back when they end.

| Plan section | Feature | Coverage |
|---|---|---|
| 10.1 Email configuration | `email-configuration.feature` | the mail server settings are saved; "Test Email Settings" passes for a working server and fails for one that cannot be reached |
| 10.3 System email notifications | `system-notifications.feature` | a form response is emailed to one or several addresses, from the site's default From address, with the form title as subject and the response in the text and the HTML part; the From address setting is used; no email for a form without an address or for a refused response |

Not automated from section 10: mailing lists (legacy), the password reset email of the admin login (finding F-33), user registration and content approval emails, and SMTP authentication and TLS against a real server.

### Finding probes

`e2e-tests/findings/` holds short tests that assert the behaviour of known findings in `e2e-tests/RESULTS.md` as it is today (for example, Masa removes the spaces from a collection name). Run them with `npx playwright test --project=findings`. A passing probe means the finding is still there on that Masa version; a failing one means Masa changed, so the finding needs another look. `RESULTS.md` has a column with the result per Masa version.

### Against an already running environment

```bash
cd e2e-tests
BASE_URL=http://localhost:18181 npx playwright test --project=smoke
```

Admin credentials default to `admin`/`admin`; override with `MASA_ADMIN_USER` / `MASA_ADMIN_PASSWORD`.

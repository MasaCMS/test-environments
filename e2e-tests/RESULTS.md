# E2E tests: changes and results log

This file is append-only. Add a new entry under "Run log" after each run and a new row to "Findings" when a new problem turns up. Each finding is written so it can be pasted into a JIRA ticket.

## 1. Changes

### 1.1 Test infrastructure
| Change | Details |
|---|---|
| Playwright E2E smoke tests | 5 tests in `e2e-tests/smoke/`: homepage, login page, wrong credentials, site manager, create/publish/view page. |
| Isolated matrix runner | `e2e-tests/scripts/e2e-matrix.sh` starts each engine/DB combination as its own compose project (`masae2e-<engine>-<db>`), waits for HTTP 200, runs the tests and tears down with `down -v`. |
| Makefile targets | `make e2e`, `e2e-all`, `e2e-features`, `e2e-report`. |
| Folder restructure | All E2E files moved into `e2e-tests/` (config, features, smoke, lib, scripts, package files). |
| `masacms` symlink | Removed from git and ignored via `/masacms` in `.gitignore`; it is a local pointer to the Masa checkout. |
| BDD layer | Gherkin features run through `playwright-bdd` (`bddgen`), as a second Playwright project `features`. |

### 1.2 File Storage Service tests (new)
Based on the manual test plan for Masa branch `feature/file-storage-service-improvements`.

| Plan section | Feature file | Coverage |
|---|---|---|
| 1 Startup | `features/startup.feature` | `?appreload=appreload` serves the front end without engine errors. |
| 2 Upload, cache, render | `features/file-storage/image-upload.feature` (JPG, PNG, GIF), `file-content.feature` (PDF) | Cache variants on disk, render API inline, attachment and `size=source`. |
| 4 Delete, restore, purge | `features/file-storage/delete-and-purge.feature` | Delete, restore, delete again, empty trash, all cache files removed. |
| 8 Asset route | `features/file-storage/render-and-assets.feature` | Inline and attachment streaming, 404 for missing files, 5 path-traversal variants. |

New support code: `lib/masa-files.ts` (reads the bind-mounted cache, raw HTTP for traversal probes), page objects for trash and uploads, fixtures in `e2e-tests/fixtures/`.

### 1.2b Content management tests (new)
Based on section 2 of the manual test plan (Confluence, MASA space). 14 scenarios in `features/content/`: page publishing and SEO fields, special characters, long content, nested pages, drafts, scheduled display, Folder/Calendar/Gallery/Link types, CKEditor bold/list/source view, version history and re-publishing an archived version. Not automated: Component and Form (no public page), Word paste, compare view, `maxArchivedVersions`, approval workflow (2.5).

### 1.2c Display objects and layout manager tests (new)
Based on section 3 of the manual test plan. 17 scenarios in `features/layout/`: inline editing (add, reorder by dragging, remove), the 12 display object types, and content collections (Max Items; a collection from the admin as source, sorted by title). Not automated: per-object settings, Feed and Calendar objects, plugin objects, collection filters, pagination, performance.

### 1.2d User management and permissions tests (new)
Based on section 4 of the manual test plan. 13 scenarios in `features/users/`: user accounts (system user in a group, no-access user, site member, special characters, duplicate username, inactive user, several groups), groups, and content permissions (Editor on one page, inheritance, Deny override, administrator). Not automated: password reset and emails, nested groups, Author and Read Only levels, member restrictions on the public site (needs the extranet setting), user-role overrides.

### 1.2e Form Builder tests (new)
Based on section 5 of the manual test plan. 17 scenarios in `features/forms/`: building a form with the six basic field types and showing it through the Form display object, submitting it as a visitor (stored in Form Data, confirmation message, submit label, several checkboxes, file upload that is served again), responses (list, exact-value search, CSV download, delete) and validation (required with and without a message, email, numeric, date, regex number range, long value, optional field). Not automated: email notifications (need a mail server), file type restrictions (no such setting), multi-page forms, form import and export (the admin offers only a CSV of the responses).

### 1.2f Plugin system tests (new)
Based on section 6 of the manual test plan. 10 scenarios in `features/plugins/`, using a small test plugin built into `fixtures/test-plugin*.zip`: install by upload, activation per site, the plugin's admin page, a changed setting, update to a newer version, deactivate and reactivate, uninstall, and a plugin display object added with the layout manager (shows its setting, follows a changed setting, page still works after uninstall). Not automated: install via URL, plugins with dependencies, configurators, plugin database tables.

### 1.2g Theme system tests (new)
Based on section 7 of the manual test plan. 11 scenarios in `features/themes/` with a generated test theme (copy of the default theme plus a marker and a custom template): a theme folder is offered after a reload, selecting and switching back, persistence, stylesheet changes, phone and desktop screens, the default templates, template inheritance, a custom template. Passed on Chromium, Firefox and WebKit (Lucee + MySQL, Masa `origin/main`). Not automated: theme settings screen, custom display regions.

### 1.2h File Manager tests (new)
Based on section 8 of the manual test plan. 13 scenarios in `features/file-manager/`: upload of five file types, folders, rename, download, delete, text file edit, filter, Site Files and Application Root, image dimensions, rotate and resize in the image editor, and inserting an image or a link into a page through the editor's Browse Server window. Not automated: file size limits, moving files, the automatic image sizes (covered by the file storage tests).

### 1.2i Categories and tags tests (new)
Based on section 9 of the manual test plan. 9 scenarios in `features/categories-tags/`: create, nest and delete categories; assign several categories and tags to pages; a folder lists the pages of a category or a tag; change the categories and tags of a page. Not automated: category navigation, tag cloud and merging tags (no such screens).

### 1.2j Email tests (new)
Based on section 10 of the manual test plan. 8 scenarios in `features/email/` with Mailpit (`e2e-tests/mail/docker-compose.yml`; the scenarios are skipped when it is not running): mail server settings saved; the connection test passes and fails; a form response is emailed to one or several addresses from the site's default From address with the form title as subject; no email for a form without an address or a refused response. Not automated: mailing lists (legacy), the admin password reset email (F-33), registration and approval emails, SMTP authentication and TLS.

### 1.4 Not automated from the file storage plan
Custom sizes and cache maintenance calls (need a temporary template), image editor crop and rotate, shared-file and version restore, admin file browser, CKEditor, `pooltest` site, plugin and bundle paths, S3 removal, temp directory and error-log checks.

## 2. Findings (candidate JIRA tickets)

The last two columns say what happened on Masa 7.6 (`origin/release/7.6`) and Masa 8.0 (`origin/release/8.0`, 8.0.0-alpha.4), Lucee + MySQL, 2026-11-20. The other columns describe the first sighting, mostly on `origin/main`. "Reproduces" means a test or probe asserts the behaviour and it is still there; "Same" means the tests that work around the behaviour pass unchanged. The probes in `findings/` assert known findings as they are today: run them with `npx playwright test --project=findings`; a failing probe means Masa changed.

| ID | Type | Summary | Details | Status | 7.6 (`release/7.6`) | 8.0 (`release/8.0`) |
|---|---|---|---|---|---|---|
| F-01 | Bug (engine) | BoxLang + MSSQL: `ClassCastException` `Short` to `Integer` | Admin pages fail on BoxLang with MSSQL. Cause is in the BoxLang/driver type handling; not diagnosed beyond the stack trace. Smoke tests that need the admin fail. | Open | Not run (BoxLang was not part of this run) | Not run |
| F-02 | Bug (engine) | BoxLang + PostgreSQL: `PgPreparedStatement.setLargeMaxRows is not yet implemented` | Raised from the admin header call `contentManager.getMyExpiresCount`. Any admin page load fails. | Open | Not run (BoxLang was not part of this run) | Not run |
| F-03 | Bug (undiagnosed) | Adobe + MSSQL never answers HTTP within 600 s | Container starts but the site never returns 200. Needs a look at the container logs. | Open | Not run (Adobe was not part of this run) | Not run |
| F-04 | Config | Missing `MURA_DEFAULTHASHALGORITHM` caused login redirect loops on Lucee and Adobe, and BoxLang not starting (`bx-lsp`) | Fixed in `fix/environment-config`. | Fix ready, not pushed | n/a (environment configuration) | n/a |
| F-05 | Config | Wrong host ports in compose files | Fixed in `fix/compose-ports`. | PR #4 | n/a (compose files) | n/a |
| F-06 | Doc mismatch | File storage plan says the render API returns the original bytes | Without a size the render API serves a re-encoded `_file` variant (2530 bytes vs 2798-byte original). Only `size=source` and the asset route are byte-identical. Plan should be updated, or confirm intended. | Open, needs confirmation | Not checked | Not checked |
| F-07 | Repo hygiene | Commit 5fe9e85 (colleague's WIP) contains a `masacms` symlink to a personal absolute path | Untracked on this branch, but it remains in history. Removing it needs a history rewrite and force-push. | Open, decision needed | n/a (repository history) | n/a |
| F-08 | Limitation | File storage tests only run locally | They read the bind-mounted cache directory (`MASA_DIR`), and the delete scenario empties the site trash. | Known | Same: the file storage tests ran locally on 7.6 | Same: the file storage tests ran locally on 8.0 |
| F-09 | Behavior to confirm | The Collection display object's own Max Items (default 4) overrides the Max Items of a collection chosen as its source | A collection created in the admin with Max Items 3 still lists 4 items when used as the source of a Collection object with the default setting. Confirm whether this is intended. Found while writing the section 3 tests, on Masa `origin/main`, Lucee + MySQL. | Open, needs confirmation | Not checked directly; the collection tests pass on 7.6 | **Changed**: the Collection object has no Max Items setting on 8.0; the limit is set on the collection itself, so the override no longer exists |
| F-10 | Possible bug (minor) | Masa removes spaces from collection names | A collection named "Sorted collection" is saved and listed as "Sortedcollection". The admin form gives no warning. Found on Masa `origin/main`, Lucee + MySQL. | Open | **Reproduces** (probe `findings/findings.spec.ts`) | **Reproduces** (probe) |
| F-11 | Testability | The front-end inline editor accepts a drag only after a delay, with no visible sign it is ready | Dragging a display object right after the list appears does nothing and selects text on the page instead. The tests wait 2.5 s. A ready indicator (or a class on the draggable items) would remove the wait. | Open, suggestion | Same: the layout tests need the wait and pass on 7.6 | Same: the layout tests pass on 8.0 |
| F-12 | Test note | Publishing a draft shows a native confirm dialog ("all un-published drafts will be removed") | Playwright dismisses dialogs by default, so nothing is published unless the test accepts it. | Known | Same: the draft tests pass on 7.6 with the dialog accepted | Same: the draft tests pass on 8.0 |
| F-13 | Test note | The calendar display's script contains the text "error occurred while fetching events" | The engine error check ignores that phrase. The visible page shows no error. | Known | Same: the calendar test passes on 7.6 | Same: the calendar test passes on 8.0 |
| F-14 | Test note | The file storage asset route test fails on Masa `origin/main` | The route only exists on `feature/file-storage-service-improvements`; run the file storage tests against that branch. | Known | **Reproduces**: the asset route test fails on 7.6 too | **Not reproduced**: the asset route exists on 8.0 and its test passes |
| F-15 | Test note | The user and group lists in the admin show 25 records per page | A new record can fall onto a later page once an environment holds many users or groups. The tests ask for all records with `recordsperpage=100000`. | Known | Same: the user tests pass on 7.6 with `recordsperpage` | Same: the user tests pass on 8.0 |
| F-16 | Testability | The kind of user (system user or site member) can only be chosen through the form's address (`setispublic=0`); the form has no visible control for it | A user created with the plain "Add User" button is a site member. Group membership then only offers member groups. The tests use `setispublic=0`. Worth checking how an administrator is meant to add a system user. | Open, needs confirmation | Same: the user tests pass on 7.6 with `setispublic=0` | Same: the user tests pass on 8.0 |
| F-17 | Test note | The Site Manager tree fills after the page has loaded | A user with limited permissions briefly sees an empty list with a spinner. The tests wait for the column headings. | Known | Same: the permission tests pass on 7.6 | Same: the permission tests pass on 8.0 |
| F-18 | Test note | The permission forms use styled radio buttons and checkboxes | The tests click the input itself, since the visible label does not reach it. | Known | Same: the permission tests pass on 7.6 | Same: the permission tests pass on 8.0 |
| F-19 | Test note | The spam check (cfformprotect) scores mouse movement, keypresses and timing | A submission with no mouse movement over time (two samples 250 ms apart) and no keypress is refused with "This submission has been marked as spam." A visitor who only clicks, but moves the mouse normally, is accepted. An earlier version of this finding said that forms with only choice fields are refused; that came from a test that moved the mouse instantly. The tests move the mouse over time, press a key and wait 3 seconds. | Known | Withdrawn: a probe on 7.6 shows a visitor who only clicks is accepted | Withdrawn |
| F-20 | Usability | The default error for a field without its own message names the internal field, not the label | A required field "Your name" without a validate message reports `The property named 'yourname' is not valid`. | Open, suggestion | **Reproduces** (asserted by `form-validation.feature`) | **Reproduces** (asserted by `form-validation.feature`) |
| F-21 | Usability | Form Data starts with a search window of the current minute, and the download uses it | Responses of an earlier minute are not listed or exported until the From and To dates are widened. The Keyword Search matches the whole value only (`Grace` does not find `Grace Hopper`) and is remembered for the admin session, so the next download is filtered by it too. | Open, needs confirmation | **Reproduces** (asserted by `form-responses.feature`) | **Reproduces** (asserted by `form-responses.feature`) |
| F-22 | Possible bug (minor) | The CSV download writes the entry time as a raw CFML timestamp | The first column holds `{ts '2026-11-20 08:58:14'}` instead of a date. | Open | **Reproduces** (probe) | **Reproduces** (probe) |
| F-23 | Possible bug (minor) | A duplicate form title discards the form being built | Publishing a form with a title already in use shows "The 'Title' that you entered is already in use." and the builder comes back empty: all fields are lost. Found while exploring. | Open | **Reproduces** (probe) | **Reproduces** (probe) |
| F-24 | Test note | The builder only registers typing, and a new field must be in the list before it is selected | Field labels and options are typed key by key; selecting a field before the builder has added it renames the previous field of that type. | Known | Same: the form tests pass on 7.6 | Same: the form tests pass on 8.0 |
| F-25 | Test note | The Form Builder checkbox "Required?" and the Form Data attachment link need scripted clicks | The checkbox is styled (the test clicks the input in the page); the "View Attachment" link is an `onclick` script, so the test reads the file address from it. | Known | Same: the form tests pass on 7.6 | Same: the form tests pass on 8.0 |
| F-26 | Behavior to confirm | Uploading a newer zip of an installed plugin through Install Plugin installs a second copy instead of updating | Installing `E2ETestPlugin` 1.0 and then uploading version 2.0 gives two entries (two Plugin IDs, two directories). The update only works through Plugin Settings > Update Plugin Version. Found on Masa `origin/main`, Lucee + MySQL. | Open, needs confirmation | **Reproduces** (probe) | **Reproduces** (probe) |
| F-27 | Possible bug (minor) | The provider link in the plugin list is URL-encoded, so it is a relative link | `providerURL` `https://github.com/...` is rendered as `href="https%3A%2F%2Fgithub.com%2F..."`, which does not open the provider's site. | Open | **Reproduces** (probe) | **Reproduces** (probe) |
| F-28 | Test note | The Directory column in Global Settings > Plugins shows the plugin ID until the plugin is activated for a site | After activation it shows the package name. | Known | Not checked | Not checked |
| F-29 | Test note | A plugin display object has no size until it is configured, and its settings open in a dialog (`#frontEndToolsModaliframe`) | The tests keep the settings open right after the drop and pick the plugin and display object there; the Apply button is a link. | Known | Same: the plugin tests pass on 7.6 | Same: the plugin tests pass on 8.0 |
| F-30 | Behavior to confirm | The file browser in the editor's Browse Server window cannot select a PDF | The menu of a PDF (grid view) has Move, Rename, Download and Delete but no Select, so only pictures can be chosen for an image or a link. A link to an uploaded PDF cannot be made with Browse Server. Found on Masa `release/7.6`, Lucee + MySQL. | Open | **Reproduces** (probe) | **Reproduces** (probe) |
| F-31 | Behavior to confirm | A category page outside a folder lists no content | `/index.cfm/category/<name>/` shows an empty content area; the listing only works below a Folder (`/<folder>/category/<name>/`), and the same for tags. The manual test plan does not say so. | Open, needs confirmation | **Reproduces** (probe) | **Reproduces** (probe) |
| F-32 | Possible bug | The Email Subject setting of the Form Builder is not used | A form with Form > Email Subject "Custom subject" sends the notification with the form title as subject. The setting and the Reply To setting are in the builder but the notification code uses the form title and the site's From address. | Open | **Reproduces** (probe) | **Reproduces** (probe) |
| F-33 | Possible bug | The "Forget your password?" email of the admin login is not sent through the site's mail server | With the site's mail server set (Site Settings > Email), the admin login says "your account information has been sent", but no email is sent: the mailer is called without a site and logs "The current mail server settings in the settings.ini are not valid ... no SMTP Server defined". Only the global mail configuration is used. | Open | **Reproduces** (probe) | **Reproduces** (probe) |
| F-34 | Test note | The File Browser lists 25 files per page and keeps its files between runs | New files can fall onto a later page. The tests upload files under unique names and find them with the filter. Rename and Delete in the image window only exist there; other files use the grid view menu. | Known | Same: the file manager tests pass on 7.6 | Same: the file manager tests pass on 8.0 |
| F-35 | Test note | Selecting a file in the editor's Browse Server window closes that window | The click that selects a file can end with the window gone (Firefox reports a closed page), so the tests do not wait for the click to finish. | Known | Same | Same |

## 3. Run log

Append a new entry per run. Template:

```
### YYYY-MM-DD: <engine>/<db>, Masa branch <branch>
- Command:
- Result: X passed, Y failed, Z skipped (duration)
- Failures: test name, error, linked finding ID
```

### 2026-11-19: lucee/mysql, Masa branch `feature/file-storage-service-improvements`
- Command: `make e2e` with `PROJECT=smoke,features` against a worktree of the Masa feature branch.
- Result: **22 passed, 0 failed** (22.7 s). 5 smoke, 3 existing BDD (login, create page), 14 file storage.
- Failures: none.
- Not run: Adobe and BoxLang with this branch; other databases.

### Earlier smoke runs (matrix)
- Results before the environment fixes (F-04) were failures caused by configuration, not by Masa. After the fixes, Lucee passed.
- BoxLang + MSSQL and BoxLang + PostgreSQL fail on admin pages (F-01, F-02). Adobe + MSSQL did not start answering (F-03).
- Exact per-combination counts were not recorded in this file at the time. Record them in the next full matrix run (`make e2e-all`).

### 2026-11-19: lucee/mysql, Masa `origin/main`
- Command: `npx playwright test` in `e2e-tests/`.
- Result: **35 passed, 1 failed**. 14 new content management tests all pass.
- Failure: file storage `Asset route streams cache files` returns 404 for the asset route. Expected: the route only exists on `feature/file-storage-service-improvements`, not on `main`.
- Test notes: publishing a draft shows a native confirm dialog that must be accepted; the calendar page script contains the phrase "error occurred while fetching events", which the engine error check ignores.

### 2026-11-19: lucee/mysql, Masa `origin/main`, layout tests
- Command: `npx playwright test` in `e2e-tests/`.
- Result: **52 passed, 1 failed**. The 17 new layout tests passed in three consecutive runs.
- Failure: file storage `Asset route streams cache files` (route only exists on `feature/file-storage-service-improvements`).
- Test notes: the inline editor's drag and drop only works after a short delay with no visible sign; Masa removes spaces from collection names; the Collection object's own Max Items setting (default 4) overrides the Max Items of a collection chosen as its source.

### 2026-11-19: lucee/mysql, Masa `origin/main`, user management tests
- Command: `npx playwright test` in `e2e-tests/`.
- Result: **65 passed, 1 failed**. The 13 new user and permission tests passed in three consecutive runs.
- Failure: file storage `Asset route streams cache files` (route only exists on `feature/file-storage-service-improvements`).

### 2026-11-20: lucee/mysql, Masa `release/7.6` (df4fc71c8, version 7.6.2)
- Command: `npx playwright test` in `e2e-tests/` with `BROWSER=chromium|firefox|webkit` and `EVIDENCE=1`, on a fresh environment (reports in `reports/7.6-<browser>/`).
- Result: **103 passed, 1 failed** on each of Chromium (10.0 min), Firefox (10.9 min) and WebKit (12.1 min). All 17 form, 10 plugin and 11 theme scenarios pass, with the content, layout, user and file storage scenarios.
- Failure: file storage `Asset route streams cache files` (F-14): the route is not on this branch either.
- Probes (`--project=findings`, Chromium): F-10, F-22, F-23, F-26 and F-27 reproduce. The probe for F-19 showed that finding was wrong; it is withdrawn (see F-19).


### 2026-11-20: lucee/mysql, Masa `release/7.6` and `release/8.0`, all sections
- Command: `npx playwright test --project=smoke --project=features` with `BROWSER` and `EVIDENCE=1`, on a fresh environment per Masa version; Mailpit running (reports in `reports/7.6-<browser>/` and `reports/8.0-chromium/`).
- 7.6 (`df4fc71c8`): Chromium **133 passed, 1 failed** (13.5 min); Firefox 131 passed, 3 failed (14.9 min); WebKit 132 passed, 2 failed (16.2 min). The failures that are not F-14 were in the new file manager tests: the editor's Browse Server window closes itself after a selection (F-35) and a resize was read back too early. Both are fixed in the tests; the 13 file manager scenarios then pass on Firefox and WebKit.
- 8.0 (`eb045472d`, 8.0.0-alpha.4): Chromium **133 passed, 1 failed** (13.7 min). The asset route test passes (F-14 not reproduced). The failure was "Limiting the number of items in a collection": the Collection object has no Max Items setting on 8.0 (F-09). The scenario is now skipped when the setting does not exist (checked on 8.0: 1 skipped, the other collection scenario passes).
- Probes (`--project=findings`, Chromium): all 9 reproduce on both versions (F-10, F-22, F-23, F-26, F-27, F-30, F-31, F-32, F-33).

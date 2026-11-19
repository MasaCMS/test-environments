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

### 1.3 Environment fixes found while running the tests
These are on separate branches and are not part of the E2E branch.

| Branch | Fix |
|---|---|
| `fix/compose-ports` (PR #4) | Corrected host ports in `boxlang/mssql` (18283) and `lucee/mssql` (`MURA_PORT: 18183`); corrected "is running on" messages in the Makefile. |
| `fix/environment-config` (commit 73bea42, not pushed) | `MURA_DEFAULTHASHALGORITHM=SHA-256` for adobe/boxlang/lucee; removed `bx-lsp` from `BOXLANG_MODULES`; PostgreSQL volume path `/var/lib/postgresql`. |

### 1.4 Not automated from the file storage plan
Custom sizes and cache maintenance calls (need a temporary template), image editor crop and rotate, shared-file and version restore, admin file browser, CKEditor, `pooltest` site, plugin and bundle paths, S3 removal, temp directory and error-log checks.

## 2. Findings (candidate JIRA tickets)

| ID | Type | Summary | Details | Status |
|---|---|---|---|---|
| F-01 | Bug (engine) | BoxLang + MSSQL: `ClassCastException` `Short` to `Integer` | Admin pages fail on BoxLang with MSSQL. Cause is in the BoxLang/driver type handling; not diagnosed beyond the stack trace. Smoke tests that need the admin fail. | Open |
| F-02 | Bug (engine) | BoxLang + PostgreSQL: `PgPreparedStatement.setLargeMaxRows is not yet implemented` | Raised from the admin header call `contentManager.getMyExpiresCount`. Any admin page load fails. | Open |
| F-03 | Bug (undiagnosed) | Adobe + MSSQL never answers HTTP within 600 s | Container starts but the site never returns 200. Needs a look at the container logs. | Open |
| F-04 | Config | Missing `MURA_DEFAULTHASHALGORITHM` caused login redirect loops on Lucee and Adobe, and BoxLang not starting (`bx-lsp`) | Fixed in `fix/environment-config`. | Fix ready, not pushed |
| F-05 | Config | Wrong host ports in compose files | Fixed in `fix/compose-ports`. | PR #4 |
| F-06 | Doc mismatch | File storage plan says the render API returns the original bytes | Without a size the render API serves a re-encoded `_file` variant (2530 bytes vs 2798-byte original). Only `size=source` and the asset route are byte-identical. Plan should be updated, or confirm intended. | Open, needs confirmation |
| F-07 | Repo hygiene | Commit 5fe9e85 (colleague's WIP) contains a `masacms` symlink to a personal absolute path | Untracked on this branch, but it remains in history. Removing it needs a history rewrite and force-push. | Open, decision needed |
| F-08 | Limitation | File storage tests only run locally | They read the bind-mounted cache directory (`MASA_DIR`), and the delete scenario empties the site trash. | Known |

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

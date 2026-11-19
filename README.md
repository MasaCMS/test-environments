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
make e2e-report ENGINE=lucee DB=mysql   # open the HTML report
```

A summary table is printed at the end and the exit code is non-zero if any combination fails. Reports are written to `e2e-tests/playwright-report/<engine>-<db>/` and failure traces/screenshots to `e2e-tests/test-results/`.

### Gherkin features

Behavior-level tests are written as Cucumber `.feature` files in `e2e-tests/features/`, run by [playwright-bdd](https://github.com/vitalets/playwright-bdd) on top of Playwright Test. They are a separate Playwright project (`features`) and are **not** part of the default `make e2e` run.

```bash
make e2e-features ENGINE=lucee DB=mysql          # features only
make e2e ENGINE=lucee DB=mysql PROJECT=smoke,features   # both
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

### Against an already running environment

```bash
cd e2e-tests
BASE_URL=http://localhost:18181 npx playwright test --project=smoke
```

Admin credentials default to `admin`/`admin`; override with `MASA_ADMIN_USER` / `MASA_ADMIN_PASSWORD`.

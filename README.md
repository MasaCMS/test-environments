# Masa CMS test environments

These are test environments for Masa CMS.

## Quick Start with Makefile

The easiest way to start a test environment is using the Makefile:

```bash
# Interactive menu - select database and CF engine
make

# Or use direct commands
make lucee-mysql      # Start MySQL + Lucee
make boxlang-postgres # Start PostgreSQL + BoxLang
make adobe-mariadb    # Start MariaDB + Adobe ColdFusion (default: CF 2023)

# Adobe ColdFusion with specific version
make adobe-mysql CF_VERSION=cf21    # ColdFusion 2021
make adobe-mysql CF_VERSION=cf25    # ColdFusion 2025
make adobe-mysql CF_VERSION=latest  # Latest version

# Stop all containers
make stop

# Stop and remove all containers
make down

# Clean everything (including volumes)
make clean

# Show all available commands
make help
```

### Available Make Commands

**Interactive:**
- `make` or `make start` - Interactive menu to select DB, CF engine, and Adobe version (if applicable)

**Combined targets (DB + CF Engine):**
- `make lucee-mysql`, `make lucee-mariadb`, `make lucee-postgres`, `make lucee-mssql`
- `make boxlang-mysql`, `make boxlang-mariadb`, `make boxlang-postgres`, `make boxlang-mssql`
- `make adobe-mysql`, `make adobe-mariadb`, `make adobe-postgres`, `make adobe-mssql`
  - Adobe targets support `CF_VERSION` parameter: `cf21`, `cf23` (default), `cf25`, `latest`
  - Example: `make adobe-mysql CF_VERSION=cf25`

**Database-only targets:**
- `make mysql`, `make mariadb`, `make postgres`, `make mssql`

**Management:**
- `make stop` - Stop all running containers
- `make down` - Stop and remove all containers
- `make clean` - Remove containers, volumes, and network
- `make help` - Show help message

## Available environments

### Adobe ColdFusion

* MariaDB
* MySQL
* PostgreSQL
**Supported Versions:**
- ColdFusion 2021 (cf21)
- ColdFusion 2023 (cf23) - default
- ColdFusion 2025 (cf25)
- Latest

When using the interactive menu, you'll be prompted to select the version.

* MSSQL

### Lucee

* MariaDB
* MySQL
* PostgreSQL
* MSSQL

### Boxlang

* MariaDB
* MySQL
* PostgreSQL
* MSSQL

## Requirements

* GIT
* Docker
* Docker compose
* Commandbox CLI

## Setup

* Clone Masa CMS into this project: `git clone git@github.com:MasaCMS/MasaCMS.git masacms`
* [optional] Add database connectors for Adobe ColdFusion:

  **MySQL Connector**
  - Download: [MySQL Connector Download](https://dev.mysql.com/downloads/connector/j/)
  - Place the jar file in `/adobe/mysql/common`

  **MariaDB Connector**
  - Download: [MariaDB Connector Download](https://mariadb.com/downloads/connectors/connectors-data-access/java8-connector)
  - Place the jar file in `/adobe/mariadb/common`

  **MSSQL Connector**
  - Download: [MSSQL Connector Download](https://learn.microsoft.com/en-us/sql/connect/jdbc/download-microsoft-jdbc-driver-for-sql-server?view=sql-server-ver17)
  - Place the jar file in `/adobe/mssql/common`

* Note: These connectors are required only if Adobe ColdFusion is used with the respective databases. Ensure compatibility with your Adobe ColdFusion version.

## Start environment

### Option 1: Using Makefile (Recommended)

```bash
# Interactive menu
make

# Or use a direct command
make lucee-mysql
```

### Option 2: Manual Docker Compose

* Open a terminal
* Navigate to the folder of the desired database (for example: /mariadb/)
* Start the database: `docker compose up -d`
* Navigate to the folder of the desired cfml engine (for example: /lucee/mariadb/)
* Start the cfml engine: `docker compose up -d`
* Open `http://localhost:{portnumber}` in the browser

### Port numbers

#### Adobe ColdFusion

* mariadb: 18080
* mysql: 18081
* postgres: 18082
* mssql: 18083

#### Lucee

* mariadb: 18180
* mysql: 18181
* postgres: 18182
* mssql: 18183

#### Boxlang

* mariadb: 18280
* mysql: 18281
* postgres: 18282
* mssql: 18283

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

* host: `localhost:3306`
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


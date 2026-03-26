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

**Note:** When selecting Adobe ColdFusion, you'll be prompted to choose a version.
This does not apply to Lucee or BoxLang engines.

### Direct Commands

#### Starting Environments

Start a specific database + CF engine combination:

```bash
# Lucee combinations
make lucee-mysql
make lucee-mariadb
make lucee-postgres
make lucee-mssql

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

#### Port Reference

#### Lucee Ports
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

##### Examples

```bash
# Start MySQL and Lucee
make lucee-mysql
# Visit http://localhost:18181 2025
make adobe-mariadb CF_VERSION=cf25
# Visit http://localhost:18080

# Start MySQL and Adobe ColdFusion 2021
make adobe-mysql CF_VERSION=cf21
# Visit http://localhost:18081
make boxlang-postgres
# Visit http://localhost:18282

# Start MariaDB and Adobe ColdFusion
make adobe-mariadb
# Visit http://localhost:18080

# When done, stop everything
make down
```

##### Troubleshooting

If you encounter issues:

1. **Port conflicts**: Check if ports are already in use
   ```bash
   lsof -i :3306  # Check MySQL port
   lsof -i :18181 # Check Lucee port
   ```

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


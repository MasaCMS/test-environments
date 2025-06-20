# Masa CMS test environments

These are test environments for Masa CMS.

## Available environments

### Adobe ColdFusion

* MariaDB
* MySQL
* PostgreSQL
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

* Open a terminal
* Navigate to the folder of the desired database (for example: /mariadb/)
* Start the database: `docker compose up -d
* Navigate to the folder of the desired cfml engine (for example: /lucee/mariadb/)
* Start the cfml engine: `docker compose up -d
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


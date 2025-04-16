
# Masa CMS test environments

These are test environments for Masa CMS.

## Available environments

### Adobe ColdFusion

* MariaDB
* MySQL
* PostgreSQL

### Lucee

* MariaDB
* MySQL
* PostgreSQL

### Boxlang

* MariaDB
* MySQL
* PostgreSQL

## Requirements

* GIT
* Docker
* Docker compose
* Commandbox CLI

## Start environment

* Clone Masa CMS into this project: `git clone git@github.com:MasaCMS/MasaCMS.git masacms`
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


# Masa CMS test environments

These are test environments for Masa CMS.

## Available environments

### Adobe ColdFusion

* MariaDB
* MySQL

### Lucee

* MariaDB
* MySQL

## Requirements

* GIT
* Docker
* Docker compose
* Commandbox CLI

## Start environment

* Clone Masa CMS into this project: `git clone git@github.com:MasaCMS/MasaCMS.git masacms`
* Open a terminal and navigate to the folder of the desired environment
* Start the environment: `docker compose up -d
* Open `http://localhost` in the browser

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

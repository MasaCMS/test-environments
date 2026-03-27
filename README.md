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

## Storage Backends

Masa CMS supports pluggable file storage via a `fileStorageService` bean that is injected at startup. Three backends are available as isolated test environments.

### How it works

On application start, `onApplicationStart_include.cfm` registers `localStorageService` as the default `fileStorageService` singleton in the bean factory. Storage modules can override this in their `onApplicationLoad` event by calling `application.serviceFactory.addBean("fileStorageService", ...)` with their own service.

All file operations route through the active `fileStorageService`:

- **`fileWriter.cfc`** — detects paths inside a site's `User_Assets` directory and calls `getBean('fileStorageService')` directly for all read/write/delete/list operations.
- **`fileDAO.cfc`** — writes and deletes cached image variants (small, medium, source) via `fileStorageService.uploadBinary()` and `deleteObject()`.
- **`fileManager.cfc`** — serves `/_api/render/small|medium|file` requests by calling `fileStorageService.streamToResponse()` for true streaming, falling back to `resolveToLocal()` + local stream.

The active backend is determined at startup:

- **Default (no module):** `localStorageService` is used — local filesystem under `configBean.getFileDir()`.
- **S3 module mounted:** `filestorage_s3.onApplicationLoad` replaces the bean with `s3StorageService` → MinIO / S3.
- **GCS module mounted:** `filestorage_gcs.onApplicationLoad` replaces the bean with `gcsStorageService` → fake-gcs-server / GCS.

Modules are **not** in the Masa core. They live in `storage/modules/` and are mounted into a Masa site via docker-compose volume mounts. When not mounted, the module doesn't exist and the local default runs automatically.

### Directory layout

```
storage/
  modules/
    filestorage_s3/       -- S3/MinIO module (opt-in via docker-compose volume)
    filestorage_gcs/      -- GCS module (opt-in via docker-compose volume)
  local/
    docker-compose.yml    -- Local filesystem (default, no module needed)
  s3/
    docker-compose.yml    -- S3 via MinIO
  gcs/
    docker-compose.yml    -- GCS via fake-gcs-server
```

### Prerequisites

All storage environments require MariaDB to be running first:

```bash
docker network create masa-test
docker compose -f mariadb/docker-compose.yml up -d
```

### Local filesystem (default)

Uses the built-in local filesystem backend. No module is mounted.

```bash
cd storage/local
docker compose up
```

Masa CMS: http://localhost:18181

### S3 / MinIO

Uses MinIO (S3-compatible) as the storage backend. The `filestorage_s3` module is automatically discovered by Masa on startup because it is volume-mounted into `sites/default/modules/filestorage_s3/`.

```bash
cd storage/s3
docker compose up
```

| Service | URL |
|---------|-----|
| Masa CMS | http://localhost:18182 |
| MinIO Console | http://localhost:9001 |

MinIO credentials: `minioadmin` / `minioadmin`  
Bucket: `masacms-assets` (created automatically on startup)

Environment variables set:
- `MURA_FILESTORE=S3`
- `MURA_FILESTOREENDPOINT=http://minio:9000`
- `MURA_FILESTOREACCESSINFO=minioadmin^minioadmin^masacms-assets`

### Google Cloud Storage / fake-gcs-server

Uses [fake-gcs-server](https://github.com/fsouza/fake-gcs-server) as a local GCS emulator. The `filestorage_gcs` module is volume-mounted into `sites/default/modules/filestorage_gcs/`.

```bash
cd storage/gcs
docker compose up
```

| Service | URL |
|---------|-----|
| Masa CMS | http://localhost:18183 |
| fake-gcs-server | http://localhost:4443 |

Bucket: `masacms-assets` (created automatically on startup)

Environment variables set:
- `MURA_FILESTORE=GCS`
- `MURA_GCSBUCKET=masacms-assets`
- `MURA_GCSENDPOINT=http://fake_gcs:4443`
- `MURA_GCSCREDENTIALS` — leave unset for fake-gcs-server (no auth)

For production GCS, set `MURA_GCSCREDENTIALS` to the contents of a service account JSON key file.

### Creating a new storage backend

1. Create a new module in `storage/modules/filestorage_<name>/` following the same structure as `filestorage_s3` or `filestorage_gcs`.
2. Implement the storage service CFC with these public methods:
   - `readFile(path)`, `readFileBinary(path)`, `writeFile(path, content)`, `deleteFile(path)`, `deleteDirectory(path)`
   - `fileExists(path)`, `directoryExists(path)`, `listDirectory(path, filter, type)`, `createDirectory(path)`
   - `copyFile(source, destination)`, `moveFile(source, destination)`, `renameFile(source, destination)`
   - `uploadFile(destination, fileField)`, `resolveToLocal(path)`, `writeFromLocal(localPath, remotePath)`
   - `uploadBinary(data, contentType, key)`, `deleteObject(key)` — used by `fileDAO` for cache variants
   - `streamToResponse(path, method)` — true streaming to servlet response; returns `true` if handled, `false` if not found
   - `getBaseUrl(siteid)` — returns the public base URL for the storage backend
3. Add an `onApplicationLoad` handler in `model/handlers/handler.cfc` that calls `application.serviceFactory.addBean("fileStorageService", createObject(...).init())`.
4. Register the handler in `config.xml.cfm`.
5. Mount it via a docker-compose volume into `sites/default/modules/filestorage_<name>/`.

On application load, Masa will discover the module and fire `onApplicationLoad`, which replaces the default `localStorageService` bean with your implementation. No core changes are needed.

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


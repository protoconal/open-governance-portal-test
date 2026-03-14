# Database Setup

> Traceability tag: DB-001
> Relates to: ADR-006

---

## Overview

Directus manages the database layer automatically.  You choose a database
provider by setting environment variables in `src/backend/.env` — no
application code changes are required.

Directus supports **SQLite**, **PostgreSQL**, and **MySQL/MariaDB** out of
the box.

---

## Supported Providers

| Provider | `DB_CLIENT` value | Notes |
|---|---|---|
| SQLite | `sqlite3` | Default — zero setup, file-based storage |
| PostgreSQL | `pg` | Recommended for production |
| MySQL / MariaDB | `mysql` | Widely available |

---

## Configuration

All database settings are controlled via environment variables in
`src/backend/.env`.

### SQLite (default — no setup required)

```bash
# src/backend/.env
DB_CLIENT="sqlite3"
DB_FILENAME="./data.db"
```

SQLite stores the database in a single file.  Perfect for development and
small deployments.

---

### PostgreSQL

```bash
# src/backend/.env
DB_CLIENT="pg"
DB_HOST="localhost"
DB_PORT=5432
DB_DATABASE="governance_portal"
DB_USER="postgres"
DB_PASSWORD="changeme"
```

---

### MySQL / MariaDB

```bash
# src/backend/.env
DB_CLIENT="mysql"
DB_HOST="localhost"
DB_PORT=3306
DB_DATABASE="governance_portal"
DB_USER="root"
DB_PASSWORD="changeme"
```

---

## Switching Providers

Switching databases is a three-step process:

1. **Update `.env`** — Change the `DB_CLIENT` and connection variables.
2. **Bootstrap** — Run `npx directus bootstrap` to initialise the new database
   with the Directus system tables and admin user.
3. **Apply schema** — Run `npx directus schema apply ./snapshots/schema.yaml`
   to recreate your collections and fields.

```bash
cd src/backend

# Edit .env with your new database settings
vim .env

# Initialise the database
npx directus bootstrap

# Apply the project schema
npx directus schema apply ./snapshots/schema.yaml
```

> **Note:** Data is not migrated automatically when switching providers.
> Export data from the old database (e.g. via the Directus REST API or
> direct SQL dump) and re-import it into the new one.

---

## Schema Management

Directus handles schema changes automatically — there are no manual migration
files to write.

### How it works

- When you create or modify collections and fields in the Directus admin
  panel, Directus applies the corresponding DDL statements to the database
  immediately.
- Schema snapshots capture the full schema as a human-readable YAML file
  that can be committed to version control.

### Schema snapshots for version control

**Export** the current schema:

```bash
cd src/backend
npx directus schema snapshot ./snapshots/schema.yaml
```

**Apply** a schema snapshot (e.g. after cloning or switching databases):

```bash
cd src/backend
npx directus schema apply ./snapshots/schema.yaml
```

**Diff** the current database against a snapshot:

```bash
cd src/backend
npx directus schema diff ./snapshots/schema.yaml
```

### Workflow

1. Make schema changes in the admin panel (or via the API).
2. Run `npx directus schema snapshot ./snapshots/schema.yaml` to export.
3. Commit the updated `schema.yaml` to Git.
4. Other developers run `npx directus schema apply ./snapshots/schema.yaml`
   after pulling.

---

## Environment Variable Reference

| Variable | Description | Example |
|---|---|---|
| `DB_CLIENT` | Database driver | `sqlite3`, `pg`, `mysql` |
| `DB_FILENAME` | SQLite file path | `./data.db` |
| `DB_HOST` | Database host (non-SQLite) | `localhost` |
| `DB_PORT` | Database port (non-SQLite) | `5432` |
| `DB_DATABASE` | Database name (non-SQLite) | `governance_portal` |
| `DB_USER` | Database user (non-SQLite) | `postgres` |
| `DB_PASSWORD` | Database password (non-SQLite) | `changeme` |
| `DB_SSL` | Enable SSL connection | `true` / `false` |

# Schema snapshot for the real-MySQL integration test

`mysql-schema-snapshot.sql` is a **structure-only** copy of the production schema (137 tables) plus the rows of
`flyway_schema_history`. It contains no application data. It is loaded by `MySqlRepositoryQueriesIT` into an
empty disposable database, after which Flyway applies any migration newer than the snapshot.

## Why a snapshot and not the migrations

The migrations start at V24. The original tables were created before Flyway was adopted, so the current chain
cannot reconstruct the pre-Flyway tables from an empty database by migrations alone. `MySqlFlywayMigrationIT`
therefore starts from this historical structure-only snapshot, applies every migration newer than the snapshot,
validates Flyway history, and runs migrate a second time to prove idempotency.

## When to refresh it

It does not have to track every migration: newer migrations are applied on top. Refresh it occasionally (or
when a migration needs the tables it captures) so the on-top set stays small.

## How to refresh

Read-only against the source database. Do not run this with write access to anything you care about.

```bash
mysqldump -h HOST -u USER -p --no-data --single-transaction --skip-triggers --skip-routines --skip-events \
  --skip-comments --set-gtid-purged=OFF --column-statistics=0 --no-tablespaces SCHEMA \
  | sed -E 's/ AUTO_INCREMENT=[0-9]+//; /^\/\*!50013 DEFINER/d; s/DEFINER=`[^`]*`@`[^`]*` //' \
  > src/test/resources/db/mysql-schema-snapshot.sql

mysqldump -h HOST -u USER -p --no-create-info --single-transaction --skip-comments --skip-add-locks \
  --skip-disable-keys --set-gtid-purged=OFF --column-statistics=0 --no-tablespaces SCHEMA flyway_schema_history \
  | sed "s/'DB_USERNAME'/'snapshot'/g" >> src/test/resources/db/mysql-schema-snapshot.sql
```

Replace `DB_USERNAME` with the database user so the history rows do not record it. Check that
`grep '^INSERT INTO' mysql-schema-snapshot.sql | grep -v flyway_schema_history` prints nothing.

Triggers are skipped on purpose because their definitions are not currently versioned in this repository.
Two are known to exist in production. Their behavior is therefore **outside the snapshot/Flyway proof** and must
not be assumed covered by `MySqlFlywayMigrationIT`. Before claiming production-schema parity, export/version
those trigger definitions (or an equivalent read-only manifest) and add dedicated behavior tests.

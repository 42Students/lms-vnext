# Local restore rehearsal, 2026-11-08 (SEC-21)

Scope: a disposable local PostgreSQL 16 (the test database, 280 public tables, 4 users, 1 audit row). Not the dev or production instance and not a Cloud SQL backup, so it proves the procedure and the verifier, not the managed service.

Steps run: `pg_dump -Fc --no-owner --no-privileges` of `lms_vnext_test` (2 s, 1.9 MB), `pg_restore` into a new database (7 s), table and row counts compared (280 tables, 4 users, 1 audit row, identical), `DATABASE_URL=<restored> node scripts/security/audit-chain-verify.mjs` returned `audit chain ok: 1 chained rows, head at 3`. The restored database was dropped afterwards.

Not shown: restore size and time at production volume, owner and grant restoration (the dump used `--no-owner --no-privileges`; roles come from the migrator and `pg-security-inventory.mjs --check` on a real restore), object-storage reconciliation, revocation reconciliation. A managed Cloud SQL point-in-time restore into a new instance still needs a disposable instance (cost decision, OWNER-ACTIONS 35).

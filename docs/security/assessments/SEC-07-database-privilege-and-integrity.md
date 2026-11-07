# SEC-07 database privilege and integrity: assessment (2026-11-08)

Method: dev database read by job with the real runtime role (`scripts/security/pg-runtime-principal-probe.mjs`, `scripts/rls-isolation-sweep.mjs`), catalog export of 742 foreign keys, code read. Evidence is manual and on dev only. Nothing is VERIFIED; proposed states below become tracker entries after a CI run.

| Control | Finding | Proposed state | Missing proof |
|---|---|---|---|
| 001 separate identities | Two now exist on dev: `lms_vnext_migrator` (owns all 278 tables, used by the migrate Job through secret `vnext-db-migrator`) and `lms_vnext_app` (web, CronJobs). No separate roles yet for scheduled jobs, external workers or emergency admin (jobs use the runtime role; no external DB workers exist; no break-glass role) | PARTIAL | Decide job role (jobs only need DML on a few tables); document break-glass (needs Cloud SQL superuser, nobody holds it today) |
| 002 least privilege | Runtime holds SELECT, INSERT, UPDATE, DELETE on all tables and USAGE on sequences; TRUNCATE, REFERENCES, TRIGGER revoked. `security_audit_events` is INSERT and SELECT only | PARTIAL | Per-table narrowing (read-only tables, insert-only logs) |
| 003 no ownership or DDL for runtime | Probe: owns 0 of 278 tables, not a member of any role, no CREATE on the database, no CREATEROLE/CREATEDB | IMPLEMENTED_UNVERIFIED (dev only) | Same on production; CI evidence |
| 004 dangerous default privileges | Default privileges for the migrator grant DML only; no function or schema defaults to the runtime role | IMPLEMENTED_UNVERIFIED (dev) | Production read |
| 005 network access | Cloud SQL private IP `10.180.16.3`; only GKE workloads reach it. Authorized networks and firewall not read from here | PARTIAL | Read instance settings (GCP read-only, owner login) |
| 006 TLS with validation | Cloud SQL does not require SSL (recorded 2026-10-14); client does not verify the server certificate | GAP | Set `ssl_mode=ENCRYPTED_ONLY` on the instance (GCP write, owner) and add the CA to the client |
| 007, 008, 009 tenant-aware relations | 127 child tables now carry `tenant_isolation_derived`: a child row can only be read, inserted or updated if its tenant parent is visible, so a child cannot attach to another college's parent (the policy's WITH CHECK). Composite tenant FKs are not used (single-column FKs only) | IMPLEMENTED_UNVERIFIED | Negative insert tests per table (the isolation sweep covers reads; acceptance covers one derived pair) |
| 010 cascade behaviour | 742 foreign keys: 629 RESTRICT, 90 NO ACTION, 21 CASCADE, 2 SET NULL. Only one cascade hangs off `college_memberships`; the rest are inside course, placement and log structures | IMPLEMENTED_UNVERIFIED | Review of the 21 cascades (list in scratch of 2026-11-07), test that deleting a membership never removes records of another tenant |
| 011 membership, role, grant integrity | `membership_roles` follows its membership by policy; unique and check constraints exist in the schema but were not reviewed one by one | PARTIAL | Constraint review |
| 012 tenant-scoped uniqueness | Not reviewed | UNASSESSED | Review unique indexes on tenant tables for a missing `college_id` |
| 013 avoid raw SQL | Rule `sql-raw-dynamic` in `security:central`: any `sql.raw()` outside `src/db/schema` with a non-literal argument fails the build (4 reviewed, all constants) | IMPLEMENTED_UNVERIFIED | CI run |
| 014 audit dynamic SQL | Same guard plus a read of template-string queries (none build SQL from input) | IMPLEMENTED_UNVERIFIED | Independent review |
| 015 mass assignment | Zod strict objects at routes (`z.strictObject`) are the pattern; not measured | PARTIAL | Rule or test that bodies use strict schemas |
| 016 transactional checks on sensitive writes | Present in several services (advisory locks, transactions); not inventoried | PARTIAL | Inventory |
| 017 revocation races | Role revocation re-read per request (context resolved from the database every request); concurrent mutation races not tested | PARTIAL | Race tests |
| 018 migration safety | `schema-drift` job, journal and snapshots, rollback notes in `rls-rollout.md`, dry-run of migrations in a rolled-back transaction (`rls-isolation-sweep.mjs --apply=`) | IMPLEMENTED_UNVERIFIED | CI evidence; production sequencing runbook |
| 019 drift detection | Probe and sweep scripts exist; not scheduled | PARTIAL | Schedule against production read-only (owner) |

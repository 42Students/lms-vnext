# Database-first parity — verified findings and next steps

**Date:** 2026-10-09. **Branch:** `db-parity-2026`. Source SHAs pinned in the JSON inventory and crosswalk.

## Finding DB00-CRITICAL: the legacy physical schema is not derivable from migrations alone

The legacy `src/main/resources/application.properties` has **both** `spring.jpa.hibernate.ddl-auto=update` and `spring.flyway.enabled=true`, using MySQL8. Accordingly:

- The Flyway chain may not include tables/columns created or modified by Hibernate.
- A static JPA/Flyway census is NOT a complete physical-schema reconstruction.
- Never say "all legacy tables" from model files alone.
- Obtain a read-only metadata-only export from the **actual** legacy DB to close DB00. No production business rows, credentials or personal data are needed.

Prepared `scripts/sql/legacy-readonly-schema.sql` produces newline-delimited JSON of tables, columns, constraints, foreign keys, referential actions, indexes, checks and trigger metadata. It deliberately excludes business table rows and trigger bodies.

The safe local command using SELECT-only DB credentials is:
```sh
mysql --batch --raw --skip-column-names --database=LEGACY_SCHEMA < scripts/sql/legacy-readonly-schema.sql > legacy-schema.jsonl
node scripts/db-parity-tools.mjs compare --legacy-jsonl legacy-schema.jsonl
```
**Do not commit `legacy-schema.jsonl`**. Sensitive values are excluded but schema metadata should still be treated as internal.

## Confirmed early gaps (present in source; dedicated equivalents absent from vNext snapshot)

- Legacy groups: `lms_group`, `lms_group_member`, `lms_group_member_event`, `lms_group_rule`. They encode reusable groups, atomic seat claims, locking, waitlists and append-only events. Source: `V166__groups_kernel.sql` plus four checked JPA entities.
- Electives: `elective_slot` and `elective_offering` are linked to group-backed classes and course details. Source: `V167__electives.sql` and corresponding JPA entities.
- Education/Identity profile verification: `profile_verification` and `profile_verification_event` track state, snapshots and audit. Source: `V187__profile_verification.sql`. Do **not** confuse these with legacy OTP/account verification entities such as `LearnerVerification`.
- Placement eligibility event/undo and dedicated batch life cycle: `V188__placement_batches_and_eligibility.sql`. A vNext eligibility decision table exists, but no explicit equivalent event table or placement-batch lifecycle.
- TPO operational persistence: original `V161`/`V162`/`V165` create company privacy/policy, lead-follow-up, messages, share links, slots, settings, saved views and detailed audit. Exact mappings and potential intentional redesign must be proved field-by-field before closure.

**Count warning:** the initial crosswalk lists source-confirmed missing dedicated structures. It is **not** the count of all missing semantic capabilities: some may be implemented in a differently modeled form or JSONB, which has to be validated. Mark `GAP_CONFIRMED` as a **physical table-equivalent gap**, not as proof a capability has no code anywhere.

## Source-side audit commands

- `node scripts/db-parity-tools.mjs status`: show pinned source counts and explicit gaps without needing a DB.
- `node scripts/db-parity-tools.mjs inventory --legacy-root /path/to/lms --output /tmp/legacy-source-census.json`: classify **all Java sources** (not just the 118 model candidates) as entity/mapped superclass/other, and inspect migration operations numerically. Regex results are candidates only: inspect inherited/JPA overrides, SQL comments, live triggers and migrations for accuracy.
- `node --test tests/db-parity-tools.test.mjs`: run source parser tests.
- `node scripts/db-parity-tools.mjs compare --legacy-jsonl /tmp/legacy-schema.jsonl`: count live table mappings and expose unresolved physical legacy tables; **never** claim field parity from table matches.

## First implementation batch recommendation

DB03 groups/electives first: produce typed Drizzle tables and constraints for all six structures and group-backed section semantics, including negative/lock/capacity/concurrency tests. Then DB04 profile verification events and DB08 placement eligibility/undo. For each, **generate** Drizzle migration and snapshot with `npm run db:generate`; never hand-edit snapshot. Replay on disposable PostgreSQL and run integration tests before checking the master plan.

### Remaining constraints

This session inspected source and committed inventory/audit tooling, but did not access a live DB, run Drizzle generation or execute DB integration tests. Existing CI runners may not start. Keep live-equivalence and release gates BLOCKED until independent execution evidence is captured.

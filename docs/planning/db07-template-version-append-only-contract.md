# DB-070 — immutable Project template revision history

**Worker:** Chat 2 · **Phase:** DATABASE · **State:** staged only, no registered migration or executed PostgreSQL verification.

## Source evidence

At `src/modules/projects/template-service.ts` the active vNext authoring workflow has **three** `.insert(projectTemplateVersions)` call sites (initial creation, revision, duplication), and **no** `.update(projectTemplateVersions)` or `.delete(projectTemplateVersions)` writer. `reviseProjectTemplate` creates a new version, rather than modifying an earlier blueprint. `publishProjectTemplate` and `archiveProjectTemplate` update **project_templates**, the mutable parent/header; these must continue to work.

The live `project_template_versions` table lacks append-only enforcement. A direct SQL writer can rewrite the version's `blueprint` or `title`, changing the historical source for existing materialized projects; it can delete unreferenced revisions, making version history discontinuous. This is a source-confirmed structural omission, **not a proven exploit by a currently exposed route**.

## Proposed persistence behavior

`docs/planning/sql/db07-template-version-append-only-staging.sql` stages one row trigger/function denying **all UPDATE and DELETE** operations against `project_template_versions` with SQLSTATE **23514**. A separate statement-level `BEFORE TRUNCATE` trigger calls the same function and denies `TRUNCATE CASCADE` before any `OLD` row is read. INSERT remains available. It applies to unreferenced revisions too, so FK references are not the only protection.

The parent `project_templates` stays mutable. A college's live assignment may change `template_version_id` to a later version of the same template; the separate **DB-068** composite-FK candidate ensures that upgrade remains within the owner template. Previously materialized project instances retain their original immutable `template_version_id`.

No exception or privileged repair mode is introduced in this draft. An erratum must be recorded as a new revision plus an explicit change note; accidental old-version mutation must not be silently tolerated. Permanent revision retention and administrative repair policy require explicit migration-integrator signoff before registration.

## Executable acceptance gates (not yet run)

- `node --test tests/db07-template-version-append-only-source.test.mjs` for source/contract drift.
- In a disposable `*_test` PostgreSQL DB **after migration promotion** and seed preparation: `DB07_TEMPLATE_VERSION_APPEND_ONLY=1 npx vitest run --config vitest.db.config.ts tests/integration/db07-template-version-append-only.test.ts`.
- The opt-in PostgreSQL suite asserts the live trigger's enabled, non-internal catalog identity before running rollback-only writes, and refuses an absent explicit `TEST_DATABASE_URL`.
- Direct UPDATE title/blueprint/owner identifiers, DELETE of an unreferenced revision, and `TRUNCATE project_template_versions CASCADE` must fail with **23514**; new-version INSERT and mutable header operations must succeed.
- Replay empty-to-head and recheck existing template create/revise/publish/archive, assignment reissue, and project materialization flows.

**Do not set DONE_VERIFIED from static checks.** This contract and SQL are unregistered. Actual Node, PostgreSQL, migration, full typecheck and service-level regressions must be executed independently; GitHub Actions billing is not a reason to stop source implementation.

## Source hardening and acceptance extension — 2026-10-12

- The previous source draft had row-level UPDATE/DELETE enforcement, but PostgreSQL `TRUNCATE` does **not** invoke row-level DELETE triggers; `TRUNCATE ... CASCADE` could bypass immutable revision retention.
- Staged SQL now adds `db07_project_template_versions_no_truncate` as an enabled `BEFORE TRUNCATE FOR EACH STATEMENT` requirement. `db07_deny_template_version_mutation()` rejects `TG_OP = 'TRUNCATE'` before evaluating `OLD.id`; it uses SQLSTATE 23514.
- The `tests/db07-template-version-append-only-source.test.mjs` source guard covers correct statement-trigger registration and rejects mutation removing it. `tests/integration/db07-template-version-append-only.test.ts` now queries the PostgreSQL catalog for **both** enabled triggers and issues a rollback-only `TRUNCATE ... CASCADE` negative witness.
- Migration integration remains exclusively Chat 1's responsibility; no numbered Drizzle migration, PostgreSQL replay or passing test command is claimed by these source commits. Existing DB-070 `COMPLETED` state must remain unverified until the full accepted database witness runs.

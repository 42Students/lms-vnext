# DB-071 — current and published template revisions must actually exist

**Phase:** DATABASE · **Worker:** Chat 2 · **Status:** staged only, not active or runtime verified.

## Proven source and schema gap

`src/db/schema/projects.ts` declares `project_templates.current_version` as a required positive integer and `published_version` as nullable with `1 <= published_version <= current_version`. These constraints **do not prove** either number identifies a persisted `project_template_versions(template_id,version)` record belonging to the same template.

The registered version table already has the unique composite key `project_template_versions_template_version_uq` for `(template_id, version)`, making composite FKs possible without adding another unique index.

Active `src/modules/projects/template-service.ts` confirms the need for **deferred** enforcement:

- Create template: INSERT `project_templates` with default `current_version=1`, then INSERT version 1 **in the same transaction**.
- Revise template: UPDATE header `current_version = current_version + 1`, then INSERT the new snapshot **in the same transaction**.
- Duplicate template: INSERT new parent with version 1, then INSERT snapshot 1 **in the same transaction**.
- Publish: check the owned current version exists, then UPDATE `published_version=current_version` and re-target live college assignments; unpublish clears `published_version`.

An immediate FK from the header to the version table would **reject valid parent-first creation and revision**. Use `DEFERRABLE INITIALLY DEFERRED` with `ON DELETE NO ACTION` (not RESTRICT, which is not deferrable for the referential action).

## Staged fix

`docs/planning/sql/db07-template-version-pointer-fks-staging.sql` proposes two constraints:

1. `project_templates_current_version_snapshot_fk` on `(id,current_version) REFERENCES project_template_versions(template_id,version)`.
2. `project_templates_published_version_snapshot_fk` on `(id,published_version) REFERENCES project_template_versions(template_id,version)`.

Both are `DEFERRABLE INITIALLY DEFERRED`. `published_version` remains optional through PostgreSQL's default MATCH SIMPLE null semantics. The staging candidate includes two orphan-pointer queries and a fail-closed preflight exception to prevent promotion over corrupt test/seed state. No registered schema/journal files were edited.

## Must-pass PostgreSQL acceptance (currently unexecuted)

The opt-in suite `tests/integration/db07-template-version-pointer-fks.test.ts` runs only when `DB07_TEMPLATE_POINTER_FKS_ENFORCED=1` against an explicitly named disposable `TEST_DATABASE_URL` ending `_test`. It must verify both constraints exist and are validated/deferred in `pg_constraint` **before** exercising writes.

- Parent-first create, followed by owned version-1 insert before COMMIT: succeeds.
- Missing current_version snapshot after COMMIT: rejects with SQLSTATE **23503**.
- Revise header to version 2, insert snapshot 2 before COMMIT: succeeds; missing snapshot 2 rejects.
- Setting published_version to an absent or wrong-template version: rejects 23503.
- Clearing published_version remains valid.
- Source-based shape tests and create/revise/duplicate/publish/unpublish/materialization suite remain green.

**Compatibility dependencies:** The DB-068 template/version UUID owner composite FKs and DB-070 append-only snapshot trigger are complementary. This task does not activate any of them. Chat 1 must approve staging, reconcile migration dependency ordering, replay on isolated PostgreSQL, run tests, and record exact SHAs/outputs. Do not count source assertions as actual Node/PostgreSQL passes or declare DATABASE DONE_VERIFIED.

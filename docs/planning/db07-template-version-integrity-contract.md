# DB-068 — Project template/version ownership at the PostgreSQL boundary

**Worker:** Chat 2 · **Phase:** DATABASE · **State:** STAGED SOURCE IMPLEMENTATION, NOT REGISTERED OR POSTGRES-VERIFIED  
**Registered-schema authority:** Chat 1. No legacy data migration.

## Proven problem

In `src/db/schema/projects.ts` the database currently permits these two contradictory facts to coexist:

1. `project_template_college_assignments.template_id = A` while `template_version_id` is an existing row with `project_template_versions.template_id = B`.
2. `project_instances.template_id = A` while its `template_version_id` belongs to B.

These are **independent** foreign keys, and a UUID's existence is insufficient to prove its parent template. This is a real relational integrity omission for direct SQL/data-import/buggy writers; it is **not proof** that the application's normal create flows currently forge it.

The existing `src/modules/projects/instance-service.ts` `loadAssignedTemplateVersion` joins template versions with both version ID and its parent template ID. The create path persists the consistent pair, demonstrating the intended invariant. `src/modules/projects/template-service.ts` `assignProjectTemplateToCollege` loads the version by (template ID, published version) and intentionally **updates** an existing live assignment to a newer version of the *same* template. `listAssignedProjectTemplates` checks the parent equality in its JOIN; `getAssignedProjectTemplateDetail` currently joins only on version UUID, an additional defensive-read opportunity for the later global API phase.

The previous staged `db07-w03-core-project-relationship-integrity-candidate.sql` enforces **project/release/sprint/task** consistency, but does **not** cover the template/version root. These are independent constraints and should be promoted together or with a documented ordering.

## Proposed structural fix (unregistered)

`docs/planning/sql/db07-template-version-parent-integrity-staging.sql` adds:

- composite unique target `project_template_versions(template_id, id)`;
- assignment FK `(template_id, template_version_id) REFERENCES project_template_versions(template_id, id)`;
- instance FK with the same composite target;
- explicit zero-mismatch preflight queries and a fail-closed pre-migration mismatch guard.

Use immediate `ON DELETE RESTRICT`; retain existing single-column references. A composite FK is appropriate because both columns are non-null in these two children. Do not add a `revoked_at IS NULL` requirement: a project may continue using an immutable materialized version after its college assignment is revoked. Do not forbid legitimate updating of a college assignment's `template_version_id` when a newly published same-template version is assigned. Database schema metadata alone does not prove an instance's version cannot later be reassigned: separate app/service lifecycle checks are still necessary.

## Negative and positive acceptance

The opt-in PostgreSQL suite `tests/integration/db07-template-version-parent-integrity.test.ts` is intended **only for an isolated prepared and promoted test database**. It must not produce spurious green results on today's unpromoted schema. The suite:

- hard-requires explicit `TEST_DATABASE_URL`, a `_test`-suffixed database name and `DB07_TEMPLATE_SCOPE_ENFORCED=1`;
- first checks PostgreSQL catalog constraints are genuinely installed;
- creates two distinct templates and versions inside rollback-only transactions;
- checks same-parent assignment and instance INSERT succeed;
- rejects cross-template INSERT and UPDATE for each with exact SQLSTATE **23503** and matching constraint name;
- accepts assignment movement between two versions of the same template, including a revoked former assignment;
- keeps all data writes isolated under one test transaction per case and rolls them back.

**Acceptance must record** Node/PostgreSQL versions, exact repository SHA and migration SHA, applied migration journal, `npm run db:test:prepare` output against a safe disposable database, exact test command/exit status, and re-read PostgreSQL catalog. Source-only assertions cannot replace this.

## Unresolved separate gates

- No numbered Drizzle migration, schema-barrel registration, or empty-to-head replay has occurred in this task.
- No assertion of live database enforcement or `DONE_VERIFIED`.
- Cross-college template assignment authorization is controlled by application and may need additional tenant-scoped trigger evidence.
- Other DB07 composite parents (project/release/sprint/task, submission/review, team membership, meeting links) remain governed by existing DB07 staged work and do not become verified through this contract.
- The global DATABASE phase stays active. API/UI work does not become unlocked by this local source completion.

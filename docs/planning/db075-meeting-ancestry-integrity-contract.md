# DB-075: same-project / same-sprint meeting links

**Chat 2 | DATABASE | DB-075 | SOURCE STAGED, UNREGISTERED, PG NOT RUN**

The current `src/db/schema/projects.ts` declares `project_meetings.project_id` with optional `linked_sprint_id` and `linked_task_id`. Individual UUID foreign keys verify that those IDs exist; they do **not** verify they belong to the meeting project, or that an explicitly linked task belongs to the explicitly linked sprint.

## Proposed relational invariants

| Meeting shape | Allowed? | Integrity rule |
| --- | --- | --- |
| General, neither link | Yes | Only project FK applies |
| Sprint only | Yes | Sprint is part of meeting project |
| Task only | Yes | Task is part of meeting project |
| Sprint and task | Yes, if matching | Sprint and task are in project **and** task belongs to linked sprint |
| Task from foreign project | No | `project_meetings_project_task_fk` |
| Sprint from foreign project | No | `project_meetings_project_sprint_fk` |
| Same project, task from different sprint | No | `project_meetings_linked_sprint_task_fk` |

Proposed SQL: `docs/planning/sql/db07-meeting-linked-ancestry-staging.sql`.
It includes **three** mismatch preflight queries, a fail-closed DO block with SQLSTATE 23514, **three** immediate composite FKs and required unique target indexes. It preserves nullable optional links with PostgreSQL `MATCH SIMPLE`: an absent link never blocks a valid general meeting, but provided links must match. No cascade, row rewrite, migration registration or legacy data copying is performed.

**Index coordination:** DB-073 already proposes `project_sprints(project_id,id)` and `project_tasks(project_id,id)` unique targets. DB-075's SQL includes idempotent copies so this staging candidate can be read in isolation; Chat 1 must de-duplicate those indexes in the generated registered schema and add only `project_tasks(sprint_id,id)` as a new unique target. These source tasks may be implementation-COMPLETED independently; DB-075's *activation* should follow compatible DB-073 registration and clean replay.

Authorization is not provided by an FK. Confirm a requester's college membership, role, meeting visibility, historical attribution, and permitted edits in API/service acceptance. Meeting links must not leak cross-tenant private data.

## Executable evidence gate

Source contract: `node --test tests/db075-meeting-ancestry-source.test.mjs` (12 authored Node source tests).

PostgreSQL acceptance: `tests/integration/db075-meeting-ancestry.test.ts` (9 authored opt-in witnesses). It imports the common DB018 disposable-target validator and fails closed unless the suite is explicitly enabled:

```bash
export TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/lms_vnext_test
export DB075_MEETING_ANCESTRY_ENFORCED=1
npx vitest run --config vitest.db.config.ts tests/integration/db075-meeting-ancestry.test.ts
```

The suite is skipped by default and checks three validated catalog FKs before any fixture write. Every test uses a rollback-only transaction. Acceptance must also test migration fail-close on contaminated rows, normal project scheduling, concurrent edits and tenant authorization. Chat 1 owns registration/migration replay.

**Source-staged is not DB verified.** No PG tests or migration replay should be credited until executed on a disposable database at a pinned commit.

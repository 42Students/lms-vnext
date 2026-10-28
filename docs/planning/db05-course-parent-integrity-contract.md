# DB-008 — one canonical course-parent integrity guard, plus an upstream companion

**Current engineering state (2026-10-29):** The canonical course-parent graph and department-college companions are REGISTERED in `drizzle/0305_db05_course_parent_graph_registered.sql` with snapshot `0305`. Fresh disposable PostgreSQL 17 journal replay, idempotent replay, direct SQL parent/cycle/tenant/isolation/race acceptance, scoped application parent tests, and learner content/read checks passed in [DB-008 acceptance run 40748768228](https://github.com/42Students/lms-vnext/actions/runs/40749907081), commit `702fbf34317bb7a2237416ad5d8eea453e9d7c9d` (**all focused workflow steps PASSED**, including `npm run typecheck` with the canonical 6 GB heap). **DB-008 as a whole is NOT DONE:** remaining source field dispositions, unregistered content/history companions, and upstream reparent/integration gates remain open. Six-chat ownership instructions below are historical, not active.

**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, especially `Course.java`, `CourseDTO.java`, and `CourseServiceImpl.setCourseFields`.  
**vNext:** `src/db/schema/courses.ts`, `src/db/schema/departments.ts`, `src/db/schema/academics.ts` and `src/modules/courses/course-service.ts`.

## Coordination / duplicate resolution

During parallel work, two alternative unregistered parent guards appeared. The **canonical** parent implementation remains **`scripts/sql/db05-course-parent-graph-guard.draft.sql`**, already recorded by the DB05 readiness manifest; it uses a single transaction advisory lock `605008001` and rejects non-`READ COMMITTED` writes pending proof. The overlapping `db05-course-parent-integrity.draft.sql` was removed, NOT registered or applied. **Do not register both variants.**

The companion now incorporated into migration 0305 is `scripts/sql/db05-department-college-move.draft.sql`: a *department-table* trigger that uses the **same advisory lock** to forbid moving an existing department between colleges while it has ANY courses. This fills a bypass of a course-row-only guard; it must be merged by Chat 1 **once** with the canonical migration. It has no duplicate column, FK, index or `courses` trigger.

## Source evidence

- Legacy `parent_course_id` is integer; DTO `parentCourseId` is boxed. When omitted, preserve the current parent. Legacy explicit zero/negative clears parent by `Math.max(value,0)`. vNext's proposed self-FK is nullable UUID, so API clear must be translated to null rather than written as a UUID zero sentinel.
- `courses.department_id` and `departments.college_id` together establish owning college. Same **college**, not necessarily same department, is the proposed parent graph invariant pending product approval.
- A self-FK and `parent_course_id <> id` do not prevent `A→B→A` or `A→B→C→A`. The canonical guard traverses ancestors with cycle detection and checks child and offering cross-college relations when course department changes.
- Changing `departments.college_id` leaves `courses.department_id` untouched and therefore never fires a `courses` UPDATE trigger. The new narrow upstream guard blocks that route while courses exist.
- Changing `academic_periods.college_id` or reparenting an offering/section/membership can still affect existing dependents; these are **not solved** by either course or department guard. Continue a separately scoped upstream invariant audit; never assert complete tenant proof from the two triggers.

## Guard and acceptance matrix

| Scope | Draft | Accepted evidence |
| --- | --- | --- |
| Parent belongs to same college | Canonical `db05-course-parent-graph-guard.draft.sql` | Source proposal only |
| Self / multi-hop cycles | Canonical recursive ancestry | Source proposal only |
| Course move breaking child or offering tenant scope | Canonical child/offering checks | Source proposal only |
| Two transactions set reciprocal parent pointers | Canonical `pg_advisory_xact_lock(605008001::bigint)` | NOT RUN; expected READ COMMITTED serialization |
| Department college changes with attached courses | New `db05-department-college-move.draft.sql`; same lock and isolation rule | NOT RUN |
| Academic period, section, offering, membership reparenting | Unresolved upstream paths | BLOCKED |
| Caller organization spoof / role authorization | Authorized service layer, not trigger | Not verified |
| Drizzle migration replay | Chat 1 after consumer rollout | NOT RUN |

## Postgres scenarios to execute before registration

1. Valid root course, same-college parent, multi-depth same-college chain, same-college **different department** parent; explicit clear via authorized API.
2. Invalid self-parent and 2-/3-node cycles. Invalid parent/child from different colleges. Invalid existing-child and existing-offering tenant break on department move.
3. Unused department can switch college; a department owning even a root/no-parent course cannot switch college. Check existing parent and offering histories remain unchanged.
4. Concurrent transactions: `A.parent=B` and `B.parent=A` race; a course INSERT races with department college reassignment; course parent mutation races with course/department move. Assert only safe outcomes or explicit deadlock/serialization abort + retry.
5. For now, non-READ-COMMITTED course parent/department college writes fail with the canonical `25001` policy; do not imply SERIALIZABLE success without a dedicated design.
6. Test missing/deleted IDs, wrong-college actor, bulk updates, mutation of upstream academic periods/sections/offerings, trigger-disable privileges, rollback and complete journal replay.
7. Compare exact current source SHAs, verify SQL state, run PostgreSQL negative/race tests, lint/typecheck/unit/build, then Chat 1 registers a single reconciled guard.

No data is migrated from legacy; this is greenfield parity of behavior and future persisted invariants.

**Current state:** Both canonical parent/department guards are REGISTERED, with focused direct SQL and application PostgreSQL acceptance passed at the linked commit. The draft files remain unregistered historical sources, not a second migration. Separate academic-period, offering, section, membership and other DB05 content/history guards are NOT RUN or not yet registered; the 92-field global DB05 source review and DB-008 task stay OPEN. Do not mark the full course domain tenant-certified from the two guarded tables. DB-008 remains IN_PROGRESS.

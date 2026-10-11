# DB-008 — one canonical course-parent integrity guard, plus an upstream companion

**Status:** source-only and UNREGISTERED, no PostgreSQL execution. **Owner:** Chat 6, active DATABASE task DB-008; Chat 1 exclusively registers numbered migrations.

**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, especially `Course.java`, `CourseDTO.java`, and `CourseServiceImpl.setCourseFields`.  
**vNext:** `src/db/schema/courses.ts`, `src/db/schema/departments.ts`, `src/db/schema/academics.ts` and `src/modules/courses/course-service.ts`.

## Coordination / duplicate resolution

During parallel work, two alternative unregistered parent guards appeared. The **canonical** parent implementation remains **`scripts/sql/db05-course-parent-graph-guard.draft.sql`**, already recorded by the DB05 readiness manifest; it uses a single transaction advisory lock `605008001` and rejects non-`READ COMMITTED` writes pending proof. The overlapping `db05-course-parent-integrity.draft.sql` was removed, NOT registered or applied. **Do not register both variants.**

The remaining unique improvement is `scripts/sql/db05-department-college-move.draft.sql`: a *department-table* trigger that uses the **same advisory lock** to forbid moving an existing department between colleges while it has ANY courses. This fills a bypass of a course-row-only guard; it must be merged by Chat 1 **once** with the canonical migration. It has no duplicate column, FK, index or `courses` trigger.

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

**Current state:** both candidates are UNREGISTERED. Node tests in `tests/db05-course-parent-integrity.test.mjs` are authored, not executed. No fields formally verified. DB-008 remains IN_PROGRESS.

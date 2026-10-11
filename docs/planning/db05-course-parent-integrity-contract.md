# DB-008: course-parent cycles, tenant lineage, and concurrent edits

**Chat 6 DATABASE source candidate, 2026-10-11.** This is **NOT** a registered migration and **NOT** an executed PostgreSQL proof.  
**Candidate:** `scripts/sql/db05-course-parent-integrity.draft.sql` (standalone companion to the existing `db05-course-parent-facets.draft.sql`).  
**Legacy oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, particularly `Course.java`, `CourseDTO.java`, `CourseServiceImpl.setCourseFields`.  
**vNext oracle:** `src/db/schema/courses.ts`, `src/db/schema/departments.ts`, `src/modules/courses/course-service.ts`.  
**Owner of integration:** Chat 1 exclusively registers Drizzle migrations and schema-barrel exports.

## Verified from source, not runtime

The legacy course has integer `parent_course_id` and integer `dept_id`. The update DTO boxes `parentCourseId`: **absent/null means preserve**, while an explicit nonpositive value clears the parent (the legacy writer normalizes with `Math.max(input, 0)`). vNext has UUID `courses.id`, `courses.department_id`, `departments.college_id`. Existing `db05-course-parent-facets.draft.sql` stages a nullable UUID self-FK and `parent_course_id <> id` check. That check prevents only a one-node loop, not `A→B→A` or deeper cycles.

A parent in a different department may still be in the **same college**. Merely checking `department_id` equality would incorrectly forbid legitimate cross-department parent links; compare `departments.college_id` instead. A parent course is a business relationship, not a tenant grant or proof of parent access rights.

## Candidate database invariants

| Invariant | Candidate mechanism | Remaining proof |
| --- | --- | --- |
| Parent is not this course | Existing self-ID CHECK and trigger | Actual PostgreSQL insert/update rejection |
| Parent and child have same college | Resolve both department college IDs inside trigger | Wrong-college negative tests, null, missing parent |
| Ancestor chains are acyclic | Recursive parent traversal with visited UUID path and repeated-node detection | Two-node, three-node, malformed existing ancestry, multirow statements |
| Ancestors do not traverse into another college | Compare every ancestor college against proposed child's college | Cross-college grandparent and bad preexisting data |
| Concurrent opposing edits cannot both commit | Transaction-scoped advisory key per college, checked after locking | Run synchronized two-connection write-skew tests, isolation-mode coverage |
| Course department move cannot invalidate parent/children | Reject cross-college course move if it has parent OR any children; lock old/new college keys in a fixed order | Concurrent department move and parent edit/insert |
| Department's college cannot be reassigned while it holds courses | Independent `departments` UPDATE trigger using same advisory key ordering | Race with new course write, nullable/no-course department move |
| Authenticated actor/permission and explicit parent clear | Remains exclusively in authorized service layer | Tenant API negative tests; absent vs 0 semantics |

## Serializability and rollout constraints

- Advisory transaction locks serialize mutations among writers that run these triggers. Do **not** infer full production safety from source inspection. Validate READ COMMITTED and SERIALIZABLE writers, deadlock retries, bulk updates, and PostgreSQL's trigger snapshot behavior. If another path bypasses triggers (replication role or privileged trigger disabling), enforce privileges operationally.
- The companion guard is **not** a replacement for FK identity checks, constraint on `parent_course_id`, application role authorization, or verification of legacy parent semantics. It is also not an application-visible hierarchy feature.
- Later migrations must not install a duplicate `parent_course_id` column/index. Integrate the helper functions/triggers into the parent-facets migration once and reconcile trigger/function names with the latest journal.
- A department college move that already references any course is prohibited by this draft. Confirm whether the product requires an administrative *move course between colleges* workflow; if it does, define a transactional cross-college transfer protocol before registration.
- A nullable UUID `parent_course_id` replaces legacy integer zero sentinel in the **database only**. APIs must translate explicit clear to null while preserving omitted fields.

## Disposable PostgreSQL acceptance plan

Run on a clean migrated schema with a real set of two colleges, departments within and across colleges, courses A/B/C and at least two concurrent connections.

1. Legal: root course with null parent; B with A parent same college; C with B parent; cross-department within the *same* college; clear B.parent with explicit API command.
2. Illegal: A parent A; A parent B while B parent A; A parent C while B→A and C→B; ancestor loop preexisting from earlier stages; parent in different college; ancestor with different college.
3. Legal cross-department *same-college* change; illegal course department change to different college when parent/child exists; department college change rejected while any course references department.
4. Race: two sessions set A.parent=B and B.parent=A simultaneously. Expect at most one commit; include repeatable/read-committed/serializable policies and deadlock/serialization retry assertions.
5. Race: move a department's college while a course is inserted into it; move a course's department while another session establishes parent/child relation; preserve invariant or reject one txn.
6. Cross-tenant direct SQL paths bypassing services must still fail. API must independently reject unauthorized parent changes and spoofed organization identifiers.
7. Clean migration replay, rollback, schema drift, index collision, trigger-name collision, and constraint lifecycle tests. Record actual command results, PostgreSQL version, exact commit and run artifacts.

**Status:** SOURCE-BASED UNREGISTERED PROPOSAL. No PostgreSQL/Node suite has been executed in this authoring batch. Never promote a DB05 field to VERIFIED from the existence of a guard.

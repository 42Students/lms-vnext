# Courses core architecture

## Scope

Courses C1 establishes the structural learning graph that later lesson/content/progress work depends on.

The model is intentionally split into four levels:

1. **Course** — reusable department-owned catalog identity.
2. **Course Offering** — that course scheduled for one Cohort in one Academic Period.
3. **Course Section Delivery** — the offering delivered to one exact Section in that Cohort and Period.
4. **Course Teaching Assignment** — one active Faculty membership teaching one exact Section delivery.

This replaces the legacy mixture of course, semester mapping, class id and faculty id with explicit relational scope.

## Core invariants

- Course structural mutation requires `courses.manage`; initially this is College Admin or an appropriately scoped Super Admin.
- Same-college active members may read course structure.
- A Course Offering may only connect Course, Cohort and Academic Period records from the same College.
- Offering periods must stay inside the Cohort's configured period range and cannot be created in a closed period.
- A Course Offering is unique for Course + Cohort + Academic Period while active.
- A Section Delivery must match the Offering's exact Cohort and Academic Period.
- A Section can receive an Offering only while the Section is active.
- A Teaching Assignment requires an active same-college membership with the FACULTY role.
- Teaching roles are PRIMARY, CO_TEACHER and TA.
- At most one active PRIMARY teacher exists for a Section Delivery.
- Duplicate active teaching assignments are prevented in PostgreSQL, not only in application code.
- A Section Delivery cannot end while active teaching assignments still exist.
- An Offering cannot archive while active Section Deliveries exist.
- A Course cannot archive while active Offerings exist.

## Why this boundary matters

Later content authorization must be based on the exact teaching assignment, not on a broad "faculty belongs to this college/course" check. Lessons, content, quizzes, assignments and grading will therefore resolve through the Course Offering / Section Delivery graph before allowing Faculty mutation.

Generic reusable course structure can still live above a Section Delivery where justified, but learner-visible or faculty-owned behavior must never infer access from a caller supplied section/course combination without resolving the owning rows from the database.

## Greenfield rule

No legacy Course records are migrated. The legacy LMS is a behavior and regression reference only. vNext Courses are created through vNext application flows, seeds or test fixtures.

## C1 exclusions

C1 does not yet implement:
- learning paths
- lessons
- lesson content
- assignments or quizzes
- learner course/progress views
- Course UI

Those begin only after this structural graph and its tenant/permission tests are green.

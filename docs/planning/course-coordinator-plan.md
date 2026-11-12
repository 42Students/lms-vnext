# Course coordinator: plan for vNext

Date: 2026-11-12
Status: BUILT IN THE REPO (code only). Nothing deployed, migration 0343 not applied to dev or anywhere but a local disposable database, no GCP. See "Build status" at the end.
Source in the old LMS: branch `coordinator-as-teacher` in `42LMS-BACKEND/_cc-audit-be`, commits `9cd15258`
(design) and `c0de5aee` (dev-found fixes), ledger `docs/course-coordinator/IMPLEMENTATION_LEDGER.md` pass 28.

## 1. The concept

One course is taught to several classes by different teachers. The college admin picks ONE of the course's
own teachers as its coordinator. They stay a normal Faculty member (no new account, role or workspace).
For that course only, they can also edit the shared, all-classes content:
lessons, lesson items, assignments and quizzes. The grant lapses while they no longer teach the course.

Not included (the old LMS removed these): attendance, sessions, roster, grading, discussions, announcements,
progress, course details. Course details stay with the admin.

## 2. What vNext has today (checked in code)

- Shape: `courses` -> `course_offerings` (a course in one cohort) -> `course_section_deliveries` (offering x section).
  `course_teaching_assignments` ties a faculty membership to a delivery (`ended_at` null = active).
- Lessons belong to an offering, so they are already shared across that offering's sections.
- Assignments and quizzes have a nullable `delivery_id`. `NULL` = shared across the offering (the "all classes" content).
  A partial unique index already distinguishes shared from per-delivery quizzes.
- Faculty write guard: `requireDeliveryContentMutation` (`learning-access.ts`) returns ADMIN if `courses.manage`,
  else FACULTY only if the person teaches that exact delivery. Quiz and assignment commands
  (`faculty-quiz-authoring-service.ts`, `faculty-assignment-authoring-service.ts`) REQUIRE a `deliveryId`, so faculty
  cannot create or edit shared (`delivery_id` null) content at all today.
- Lesson and lesson-content writes (`lesson-service.ts`, `lesson-content-service.ts`) need `courses.manage`
  (admin level). Faculty cannot create or reorder shared lessons.
- Every faculty write already re-checks the persisted user, membership, role and teaching grant inside the
  write transaction. The coordinator check must do the same.
- No coordinator concept exists. (`drive-day-coordinator-*` is a placement feature, unrelated.)

So this is NOT a small add-on: it needs a new grant table plus new shared-content paths for faculty
(lessons, items, assignments, quizzes), not just a flag.

## 3. Decisions to confirm before building

1. Grant unit. Old LMS: per course. vNext lessons live on the OFFERING (course x cohort). Recommended: grant per
   offering. The teacher must actively teach a delivery of that offering. (Per course across cohorts would need
   several grants or a looser rule.)
2. One active coordinator per offering (old LMS: 409 on a second). Recommended: same.
3. Lapse. Grant stops working while they have no active teaching assignment on a delivery of that offering;
   the row stays and works again if they return. Recommended: same, computed on every request, never cached.
4. Scope: shared content (delivery_id null) of the offering, plus content of deliveries they teach.
   Other teachers' per-section content stays out of reach, including by direct id (the 9 Nov dev bug).
5. Hidden lessons: learners get nothing from a hidden lesson's items by direct request (the 9 Nov dev bug).
   Needs a check on the vNext learner read path, whether or not coordinator ships.
6. Plain teachers lose the right to manage another teacher's shared quiz (old rule). Today vNext faculty cannot
   touch shared content, so this is already true. Keep it that way for non-coordinators.
7. Results: coordinator sees NO other teachers' student results or grading for shared items (old LMS removed it).

## 4. Build plan

Step 1. Schema (migration 0343, written in repo, NOT applied to dev)
- `course_offering_coordinators`: id, offering_id, membership_id, college_id, granted_by_membership_id,
  granted_at, revoked_at, revoked_by_membership_id, version. Partial unique index on (offering_id) where revoked_at is null.
  FKs restrict. RLS in line with the other course tables (follow migration 0338 pattern).
- `course_offering_coordinator_events`: append-only log (GRANTED, REGRANTED, REVOKED, LAPSED seen), with actor.
- DB trigger or constraint check that offering and membership are in the same college.

Step 2. Domain module `src/modules/courses/coordinator/`
- `coordinator-policy.ts`: pure `isActiveCoordinator`, `mayChangeContent(scope)`; unit-tested without a DB.
- `coordinator-service.ts`: `listEligibleTeachers`, `grant`, `revoke`, `getCoordinatorForOffering`. Admin-only
  (`courses.manage` + `assertPersistedPlatformPermission`), same-college, 409 on a second active grant, audit events,
  `recordSecurityEvent` for grant/revoke.
- `requireCoordinatorContentMutation(context, offeringId, deliveryId|null)`: re-reads membership, FACULTY role,
  user active, grant active, and active teaching on the offering, under SHARE locks in the write transaction.

Step 3. Authorization wiring (smallest possible change to existing code)
- Extend `requireDeliveryContentMutation` / add an offering-level sibling so a coordinator passes for shared content
  and for own deliveries only.
- Lessons and lesson items: allow the coordinator for add, rename, reorder, hide/show, delete (soft) on their offering.
- Assignments and quizzes: allow `delivery_id` null creation and edit for the coordinator; per-delivery content only
  for deliveries they teach.
- Direct-id lookups (get, edit, delete, restore) must check delivery ownership, not only the offering.
- Every other faculty/admin route stays unchanged.

Step 4. API
- Admin: `GET/POST/DELETE /api/courses/offerings/[offeringId]/coordinator` (route wrapper with auth, csrf, rate limit).
- Faculty: existing faculty authoring routes accept "shared" as the target. No new role, no new nav entry.

Step 5. UI (exact wording rule: new strings only, nothing existing renamed)
- Admin course page: "Course coordinator" picker (eligible teachers only), remove button, history.
- Faculty: courses they coordinate show a small "Coordinator" badge; "Who gets this" choice (all classes or one class)
  on add-content forms for coordinators only.
- No sidebar change. Role switcher unaffected (still one selected role).

Step 6. Tests (write first for the dev-found cases)
- Other teacher's per-section quiz and assignment: denied, including by direct id.
- Revoked grant: denied. Lapsed grant (teaching ended): denied; restored when teaching resumes.
- Wrong college / wrong offering: denied. Second active grant: 409. Non-admin granting: denied.
- Suspended or disabled coordinator, and role removed mid-session: denied inside the transaction.
- Non-coordinator faculty cannot create shared content. Learner cannot read items of a hidden lesson.
- Happy path: grant, add shared lesson, shared quiz, shared assignment, edit, hide, revoke.
- Audit/security events written. Route origin/CSRF coverage test passes. RLS test for the new tables.

## 5. Order, size and risk

Order: decisions -> migration + policy + service (with tests) -> wiring -> API -> UI -> full targeted test run.
Size: large. The shared-content write paths are the bulk of the work.
Highest risk: widening faculty write access (direct-id bypass), and RLS on the new tables.
No deploy, no applied migration, no GCP. Dev rollout is a separate, owner-approved step after code review.

## 6. Needs a yes before starting

Decisions 1 to 4 and 7 above (recommended answers given).

## 7. Build status (2026-11-13)

Decisions used (the recommended answers): grant per offering; one active coordinator per offering; lapses while the
teacher has no active teaching assignment on the offering and returns with it; scope is shared content plus own
sections; no access to other teachers' results or grading.

Built and tested against a local disposable PostgreSQL:
- Migration 0343 (grant table, append-only events, same-college guard, no-delete and no-rewrite guards, tenant RLS).
- coordinator-policy.ts (pure rules, unit tested), coordinator-service.ts (grant, revoke, eligible list, history,
  authority checks, in-transaction recheck), coordinator-workspace.ts (shared workspace for the coordinator page).
- Shared-content writes now accept the counted coordinator, admin behaviour unchanged: lessons (create, edit, hide/show,
  archive, restore, move, reorder), shared lesson items (create, edit, publish/archive, list), shared assignments and
  shared quizzes (create, edit, transition). A coordinator cannot move a lesson to another offering, and cannot touch
  another teacher's section-only items (tested by direct id).
- Admin API: GET/PUT/DELETE /api/courses/offerings/[offeringId]/coordinator. Faculty API: GET /api/courses/faculty/coordinated (403 for other roles).
- UI: "Course coordinator" panel on the admin course Syllabus tab; "Courses you coordinate" on the teacher course list;
  /teacher/coordinate/[offeringId] reuses the admin lesson screen minus learning-path setup and quiz-results publishing.
- Tests: tests/unit/course-coordinator-policy.test.ts (7), tests/integration/course-coordinator.test.ts (20, needs
  TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1).

Findings while building:
- vNext already hides a hidden lesson's items from learners on every direct read path (the old LMS needed a fix on 9 Nov).
- Removing the FACULTY role ends the person's teaching assignments by a database trigger, so a coordinator who loses and
  regains the role stays paused until their teaching is restored. That is intended.
- Three source-text tests (db05-authoring-parent-locks 7, 8, 11) fail on this Windows checkout both before and after
  this work (line endings); they pass in the LF CI tree.

Not done / for the owner:
- Apply migration 0343 to dev (a deploy step, separate approval).
- Set results publishing for shared quizzes (kept admin-only on purpose).
- A browser walk-through of the new screens on a deployed dev site.

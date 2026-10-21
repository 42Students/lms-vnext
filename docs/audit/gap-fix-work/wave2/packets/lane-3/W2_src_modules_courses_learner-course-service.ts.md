# Work packet (wave 2): edit src/modules/courses/learner-course-service.ts

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u006-learner-courses.md, docs/audit/gap2/lane-16/u008-learner-syllabus.md, docs/audit/gap2/lane-18/syllabus-liveclass.md, docs/audit/gap2/lane-3/student-course-controller.md

## G2-15-006-068  [P2] GAP  facet F22  effort M
- Legacy: Legacy elective recognized is_elective boolean and slot name (courseListingUtils.js:98-103)
- vNext now: VNext offeringType elective, slot name not projected; group-backed delivery list (learner-course-list.tsx:131-148; learner-course-service.ts:40-41)
- Fix: Map group/slot and separate elective outcome in DB query

## G2-16-008-038  [P2] GAP  facet F10  effort L
- Legacy: `syllabus.js:4-7,678-758`: GET lessons, quiz list, submitted assignments, content progress separately via Spring service.
- vNext now: `learner-course-service.ts:804-965,1077-1115`: aggregate Drizzle queries incl typed assessments, permissions.
- Fix: Verify all published scopes and partial failure handling; preserve projection and sort.

## G2-16-008-041  [P2] GAP  facet F11  effort M
- Legacy: `syllabus.js:544-563,656-657`: learnerChildAvailability hides unpublished, blocks locked; status/eligibility.
- vNext now: `learner-course-service.ts:925-965`; `learner-course-workspace.tsx:157-196`: DB filters published and scheduled labels.
- Fix: Verify lesson publication and locked content are not leaking in vNext per tenant/delivery.

## G2-16-008-043  [P2] GAP  facet F12  effort M
- Legacy: `syllabus.js:249-256,1053-1078`: expired unsubmitted quiz shows Missed/reviewOnly, missing deadline disabled.
- vNext now: `learner-course-service.ts:1034-1073`; `learner-course-workspace.tsx:581-596`: CLOSED/MISSED read-only attempts, no item-row missing deadline badge.
- Fix: Expose disabled quiz missing-deadline status on list and read-only review state, not attempts.

## G2-16-008-062  [P2] GAP  facet F19  effort M
- Legacy: `syllabus.js:678-758`: independent abortable concurrent/follow-up fetches for lesson/quiz/progress.
- vNext now: `learner-course-service.ts:804-1075`: sequential DB projection within one server request, stateWarnings catches optional.
- Fix: Maintain partial loading/errors without blocking all content; consider streaming boundary.

## G2-16-008-067  [P2] GAP  facet F21  effort M
- Legacy: `syllabus.js:4-7`: Spring lesson/quiz APIs and external media viewers.
- vNext now: `learner-course-service.ts:804-1075`; `learner-course-workspace.tsx:253-322`: Drizzle aggregate plus signed media and external providers.
- Fix: Verify video/YouTube playback availability and external URL safety against approved original.

## G2-16-008-069  [P2] GAP  facet F22  effort L
- Legacy: `syllabus.js:679-757`: lesson, progress, submitted assignments and quizzes are fetched by course + class.
- vNext now: `learner-course-service.ts:804-1075`: content/assignment/quiz projections by delivery, membership and published status.
- Fix: Create reconciliation checklist for class→delivery membership, published states and old numeric IDs.

## G2-18-008-038  [P2] GAP  facet F11  effort M
- Legacy: Old `isFacultyRole` true for FACULTY or ADMIN, so faculty always join/delete, learner only Mark as complete (`syllabus/liveclass.js:67-71,110-112,132-151,221-225`).
- vNext now: New learner service strictly ACTIVE membership LEARNER and content UI only learner (`learner-course-service.ts:57-69`; `learner-course-workspace.tsx:330-339`).
- Fix: Use role-specific shared viewer or verify separate faculty component matches controls.

## G2-18-008-069  [P2] GAP  facet F22  effort M
- Legacy: Old progress per learner+content stores WATCHED or completedAt (`MarkCompleteButton.jsx:16-36`; `LearnerContentProgressServiceImpl.java:68-119`).
- vNext now: New learnerContentProgress per user/content/delivery and `COMPLETED` (`resource-progress-control.tsx:36-64`; `learner-course-service.ts:29-31`).
- Fix: Map old WATCHED/completedAt to new COMPLETED, handle duplicate attempt uniqueness and completion date.

## G2-3-025-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:98-112`
- vNext now: `src/modules/courses/learner-course-service.ts:74-85`
- Fix: Map class-level course browsing to the scoped section/delivery roster path; do not treat learner-only list as equivalent to authorized faculty/admin /byClass.

## G2-3-025-017  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:183-184`
- vNext now: `src/modules/courses/learner-course-service.ts:244-249`
- Fix: Legacy mapping is semester.courseOrder; vNext orders by academic period start, offering displayOrder then course name. Decide and document required ordering for equivalent views.

## G2-3-025-043  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:193-217`
- vNext now: `src/modules/courses/learner-course-service.ts:343-381`
- Fix: Legacy matches faculty assignment to class+course+semester and normalized academic start year, then sorts role/id; vNext joins assignment to delivery and sorts role/displayName.

## G2-3-025-044  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:275-323`
- vNext now: `src/modules/courses/learner-course-service.ts:251-314`
- Fix: Legacy appends only active enrolled group-backed elective offerings matching semester/year and de-duplicates course ID; vNext replaces primary with bound group deliveries and combines group roster paths.

## G2-3-025-059  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:183-190`
- vNext now: `src/modules/courses/learner-course-service.ts:85-121`
- Fix: Legacy batch fetches mappings and faculty for one resolved semester; vNext renders potentially all historical deliveries plus up to four workspace/instructor lookups each. Assess high-volume latency.

## G2-3-025-063  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/StudentCourseServiceImpl.java:194-209`
- vNext now: `src/modules/courses/learner-course-service.ts:171-190`
- Fix: Normalize year formats ('2026-27'/'2026-2027'/2026) if legacy assignment sources remain; verify new period semantics instead of assuming string equality.

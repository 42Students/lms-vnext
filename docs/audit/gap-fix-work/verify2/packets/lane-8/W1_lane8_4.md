# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-16-007-022 [P1] GAP facet F06
- Files: src/app/(authenticated)/college/semester-courses/page.tsx, src/components/academics/college-term-mapping-manager.tsx
- Legacy: `SemesterCourseMapping.js:141-155`: college context change resets all lookup/mapping state and aborts prior async results.
- Expected fix: Key manager by collegeId and reset state on college change to prevent stale cross-college draft/selection.

## G2-16-007-037 [P1] GAP facet F09
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: `SemesterCourseMapping.js:243-252`: dirty edit Cancel opens `Discard mapping changes?` dialog.
- Expected fix: Prevent accidental edit loss with dirty-state discard confirmation.

## G2-16-007-042 [P1] GAP facet F10
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: `SemesterService.js:28-29`: bulk add raw `course_ids`, no credits/type forced by client.
- Expected fix: Match legacy server default choice and preserve actual is_mandatory/type semantics before setting CORE unconditionally.

## G2-16-007-046 [P1] GAP facet F12
- Files: src/components/academics/college-term-mapping-manager.tsx, src/modules/academics/college-term-mapping-model.ts
- Legacy: `SemesterCourseMapping.js:218-229`: edit credits (default 3), hidden isMandatory switch, courseOrder.
- Expected fix: Determine required legacy isMandatory storage parity; if preserved, migrate/read-write field even if hidden.

## G2-16-007-071 [P1] GAP facet F20
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: `SemesterCourseMapping.js:57-60,77,90,115,130`: lookup/mapping sequence refs ignore responses from old scope.
- Expected fix: Key manager per college scope and term, reset per-scope draft/edit to avoid stale state.

## G2-16-023-040 [P1] GAP facet F14
- Files: src/app/(authenticated)/learn/my-placements/placement/page.tsx
- Legacy: LearnerPlacementService.java:38-44 letterUrl included in offers.
- Expected fix: Surface secure offer letter download with signed URL expiry/permissions.

## G2-17-002-019 [P1] GAP facet F05
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:283-284 filters already-mapped courses only from college-wide choices.
- Expected fix: Confirm cross-department mapping policy; restore permissible college-wide courses if backend allows.

## G2-17-002-025 [P1] GAP facet F06
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:157-188 program/semester switches confirm if unsaved course choices exist; draft restoration per semester.
- Expected fix: Confirm scope switch when unsaved selections exist; restore old current value until confirmed.

## G2-17-002-026 [P1] GAP facet F06
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:372-375 Add button disabled if no semester, mappingError, tableLoading, reordering or courses lookup error.
- Expected fix: Block add while mapped data unavailable or stale; represent lookup failures and pending reorder explicitly.

## G2-17-002-029 [P1] MISSING facet F06
- Files: src/components/academics/college-term-mapping-manager.tsx, src/modules/academics/college-term-mapping-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:421 hidden isMandatory Switch preserved on edit payload at :228-229.
- Expected fix: Decide and document mandatory-to-type migration; provide equivalent edit action if parity required.

## G2-17-002-030 [P1] GAP facet F06
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:410-426 Modal Save Changes/Cancel cannot mask-dismiss and disables closing while editLoading.
- Expected fix: Use modal with exact actions and busy/dirty-close protections.

## G2-17-002-040 [P1] MISSING facet F09
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:173-176 Modal.confirm 'Switch programs with unsaved course choices?' with selected count and 'Switch program'.
- Expected fix: Restore guarded unsaved-choice program confirmation with precise title/body/button.

## G2-17-002-041 [P1] MISSING facet F09
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:185-187 Modal.confirm 'Switch semesters with unsaved course choices?' with selected count and 'Switch semester'.
- Expected fix: Restore semester-change confirmation before preserving/restoring draft.

## G2-17-002-042 [P1] MISSING facet F09
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:250-251 dirty edit cancel opens danger confirm 'Discard mapping changes?' and 'Discard changes'.
- Expected fix: Compare original vs draft credits/order and ask before discarding dirty form.

## G2-17-002-047 [P1] GAP facet F10
- Files: src/components/academics/college-term-mapping-manager.tsx, src/app/api/academics/semester-course-mappings/[mappingId]/route.ts, src/modules/academics/college-term-mapping-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:253-258 DELETE invokes docs/legacy-source/frontend/src/api/Services/SemesterService.js:31-32 by semesterId/courseId, hard delete docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:112-114.
- Expected fix: Explicitly describe newly blocked current-term deletions before confirm.

## G2-17-002-049 [P1] GAP facet F10
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:263-276 reorders via bulk PUT docs/legacy-source/frontend/src/api/Services/SemesterService.js:69-70 mappingIds full sequence.
- Expected fix: Reintroduce whole-list reorder commit after drag and rollback on error.

## G2-17-002-056 [P1] GAP facet F12
- Files: src/modules/academics/college-term-mapping-model.ts, src/db/schema/academic-terms.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:40-42,134-138 backend accepts credit 0..30, while docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:418-420 UI edits 1..10.
- Expected fix: Reconcile API/UI/DB limits and historical 0/>10 credits.

## G2-17-002-059 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/semester-courses/page.tsx, src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:385-403 separately handles table refresh, reorder, stale mapping error, staffing error and 6-row first-load skeleton.
- Expected fix: Introduce separate lookup, mappings and staffing loading/error states with targeted retries.

## G2-17-002-081 [P1] GAP facet F20
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:243-251 cancels dirty edit only after confirmation.
- Expected fix: Implement dirty confirmation and preserve pending values on cancel dismissal.

## G2-17-002-090 [P1] MISSING facet F23
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:169-187 unsaved-change modals, :250-251 discard modal, :383 manual Refresh, :404 keyboard reorder help.
- Expected fix: Restore missing state-protection and keyboard/refresh controls before parity sign-off.

## G2-17-010-028 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-49 — Calls announcements.deadlineToday and shortlistDueTomorrow.
- Expected fix: Implement source event generation for both reminders.

## G2-18-006-017 [P1] GAP facet F05
- Files: src/modules/academics/learner-calendar-window-model.ts, src/components/academics/learner-class-schedule.tsx
- Legacy: Old calendar fetch date range recomputed on day/week/month navigation (`CalendarEvents.js:69-100`).
- Expected fix: Refetch by visible period and synchronize URL on navigation.

## G2-18-006-019 [P1] GAP facet F05
- Files: src/modules/academics/learner-schedule-service.ts
- Legacy: Old course options come from program structure (`useCourses.js:90-111`).
- Expected fix: Decide intentional roster restriction and match visible sort/order.

## G2-18-006-020 [P1] MISSING facet F05
- Files: src/components/academics/learner-class-schedule.tsx
- Legacy: Old reactive BigCalendar default `+N more` popup (`StandardCalendar.js:48-49,224-253`).
- Expected fix: Make overflow indicator open all hidden sessions.

## G2-18-006-021 [P1] GAP facet F05
- Files: src/components/academics/learner-class-schedule.tsx
- Legacy: Old week/day event calendar supports duration blocks (`StandardCalendar.js:224-253`).
- Expected fix: Span blocks across end times and handle overlaps.

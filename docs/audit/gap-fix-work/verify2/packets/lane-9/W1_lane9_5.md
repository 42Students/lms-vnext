# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-16-023-056 [P1] GAP facet F23
- Files: src/app/(authenticated)/learn/my-placements/placement/page.tsx
- Legacy: LearnerPlacementService.java:47-48 debarments and notices in overview.
- Expected fix: Expose explicit debarment status with dispute navigation.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-007-021 [P1] GAP facet F05
- Files: src/components/courses/college-lesson-visibility-controls.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:511-517 — Preserves selected row keys while paginating, clears on course/search changes.
- Expected fix: Persist selection across pages within unchanged filter scope and clear intentionally.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-007-025 [P1] MISSING facet F06
- Files: src/components/courses/college-lesson-create-control.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-61 — `Visible to students` enabled by default on creation and edit, with explicit hiding helper.
- Expected fix: Add create visibility switch and propagate to mutation/service.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-007-045 [P1] GAP facet F10
- Files: src/components/courses/college-lesson-create-control.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:258-269 — Create payload sets sequence 0; backend appends and sets both `active`, `enabled`.
- Expected fix: Verify two-write failure recovery and surface exact legacy visibility defaults.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-007-050 [P1] GAP facet F11
- Files: src/modules/courses/college-learning-directory-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:139-160 — Legacy validates superadmin JWT college/org scope plus course admin rights.
- Expected fix: Review admin impersonation/read pathways, align scoped edit/delete visibility with acting-college policy.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-008-012 [P1] GAP facet F04
- Files: src/modules/courses/lesson-resource-materials-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:61-64 — resource_materials is stored in contentDataDTO JSON, supports camel/snake.
- Expected fix: Define backfill/compatibility mapping for all legacy material shapes.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-008-040 [P1] GAP facet F10
- Files: src/modules/courses/lesson-resource-materials-service.ts
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:158-219 — Single Resource save payload has parent, JSON materials and notes.
- Expected fix: Ensure parent/child create and scope are coherently persisted.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-008-042 [P1] GAP facet F11
- Files: src/modules/courses/lesson-resource-materials-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:65-66 — Faculty edits/removes; learner completion only.
- Expected fix: Test all college admin/faculty/learner permission combinations.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-008-046 [P1] MISSING facet F12
- Files: src/modules/courses/lesson-resource-materials-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:118-122 — Presigned file GET is valid 15 minutes.
- Expected fix: Implement short TTL and refresh only on Open.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-008-066 [P1] MISSING facet F19
- Files: src/modules/courses/lesson-resource-materials-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:68-90 — Fetch signed grant at user click only; no pre-sign on list load.
- Expected fix: Add on-demand signer, private no-store responses.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-003-001 [P1] GAP facet F01
- Files: src/modules/courses/super-admin-content-directory-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:70-74 groups all types under /superadmin/lesson-content?type=video\|resources\|live-classes.
- Expected fix: Add redirects from legacy URL preserving type and relevant filters to separate new routes.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-003-020 [P1] GAP facet F06
- Files: src/modules/platform-settings/legacy-setting-specs.ts, src/components/courses/super-admin-content-directory-page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:52-61 global setting watched threshold default90, min1 max100, suffix%.
- Expected fix: Restore policy field at video tab or prominent link directly to editable global settings, even without college selected.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-001-025 [P1] GAP facet F12
- Files: src/modules/courses/faculty-course-service.ts
- Legacy: docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:25-47 selects requested cls, then preferred cls, stored cls, lowest class ID; rejects no active assigned class.
- Expected fix: Define compatibility rule for links with ?cls= and multiple deliveries; map to the matching vNext delivery rather than silently selecting wrong section.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-010-011 [P1] GAP facet F02
- Files: src/app/api/internal/placements/recruiter-message-reminders/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:68-70 — Recruiter unread email every 5 min, initial 90-second delay.
- Expected fix: Run authenticated endpoint every five minutes; check initial delay.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-17-010-057 [P1] GAP facet F21
- Files: src/app/api/internal/placements/recruiter-message-reminders/route.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:38-73 — Relies on Spring scheduler and TpoMail/notification services.
- Expected fix: Create explicit scheduler-to-worker integration contracts.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-18-007-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/videos/page.tsx, src/app/(authenticated)/college/resources/page.tsx, src/app/(authenticated)/college/live-classes/page.tsx
- Legacy: Single `/college-admin/lesson-content` route chooses Resources for `type=resources`, otherwise shared Video/Live Lessons view; defaults Video (`college-admin/lesson-content.js:34-38`; `LessonContent.js:102-125`).
- Expected fix: Legacy-path redirect preserving `type=video\|live-classes\|resources`; default Videos.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-18-007-019 [P1] MISSING facet F04
- Files: src/modules/courses/college-content-aggregate-service.ts, src/components/courses/college-content-aggregate.tsx
- Legacy: Old VIDEO external or file proxy key renders View button (`LessonContent.js:1001-1033`).
- Expected fix: Add click-to-resolve signed View endpoint under courses.manage; never include raw key.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-18-007-058 [P1] GAP facet F12
- Files: src/modules/courses/college-content-aggregate-service.ts, src/app/(authenticated)/college/videos/page.tsx
- Legacy: Old video tab admits VIDEO and YOUTUBE, live-only LIVE_CLASS (`LessonContent.js:92-125`).
- Expected fix: Make VIDEO write possible or mark explicitly unsupported with migration strategy.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-18-010-038 [P1] GAP facet F10
- Files: src/app/api/internal/placements/recruiter-message-reminders/route.ts
- Legacy: Legacy Recruiter unread scheduling via `RecruiterMessageEmailService` periodic due query (`RecruiterMessageEmailService.java:61-89`).
- Expected fix: Configure and verify recurring worker with secret; no side effects in GET.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-18-010-052 [P1] GAP facet F15
- Files: src/modules/messaging/model.ts, src/modules/messaging/service.ts
- Legacy: Legacy recruiters campaign unsubscribe and sender header per college via TpoEmailCampaignService (`TpoEmailCampaignService.java:50-110`).
- Expected fix: Wire suppression repository to campaign sender, verify per-college unsubscribed and send preview.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-18-001-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx, src/modules/courses/faculty-course-service.ts
- Legacy: Legacy `/teacher/courses/:courseId/...` accepts slug or positive numeric mapping/course ID and canonicalizes numeric to slug. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-115`, `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:2-20`
- Expected fix: Add safe legacy-deep-link resolver from numeric mapping/course slug plus explicit section to an authorized delivery UUID; redirect with preserved intended tab.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-18-001-004 [P1] GAP facet F01
- Files: src/components/courses/faculty-course-tab-navigation.tsx, src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx, src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx
- Legacy: `?cls=<numeric-class-id>` selects authorized class and canonicalizes a stale class selection. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:67-82`, `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:23-47`
- Expected fix: Introduce legacy numeric-class map with tenant/teacher authorization and redirect; do not silently show an unrelated section.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-18-001-032 [P1] GAP facet F05
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx, src/components/courses/faculty-course-workspace.tsx
- Legacy: Legacy Blueprint filters lower-case `all,lectures,resources,assessments,live-sessions` and retain page while switching. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:90-98`, `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:402-411`
- Expected fix: Accept both old lower-case variants and vNext enums; canonicalize links without discarding user filter.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-18-001-049 [P1] GAP facet F09
- Files: src/components/courses/faculty-course-workspace.tsx
- Legacy: Legacy syllabus opens modal for video/YouTube/resource/live/quiz, with 760px or 1120px widths and independent assignment drawer. `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/syllabus.js:1174-1210`
- Expected fix: Provide one item-activation preview with legacy viewer and the 760/1120 sizing; assignment as distinct drawer.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

## G2-18-001-052 [P1] GAP facet F10
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx, src/modules/courses/faculty-course-service.ts
- Legacy: Legacy course bootstrap calls GET mapping-by-id, GET course-by-id or slug, GET active teacher assignments, writes only Redux route context. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:60-135`, `docs/legacy-source/frontend/src/api/Services/courseServices.js:186-208`, `docs/legacy-source/frontend/src/api/Services/courseServices.js:316-345`, `docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:30-33`
- Expected fix: Introduce safe compatibility redirects for existing external links; do not reintroduce client-side authoritative Redux.
- [ ] DEFERRED: Requires implementation-level parity confirmation; no OK or FIXED claim made in this pass.

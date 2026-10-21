# Work packet (wave 2): edit src/modules/courses/college-learner-progress-service.ts

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-progress-controller.md, docs/audit/gap2/lane-4/learner-content-progress-model.md, docs/audit/gap2/lane-8/college-course-progress.md

## G2-2-015-015  [P2] GAP  facet F05  effort M
- Legacy: legacy course dropdown sorts active first then most recent semester (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:113-122`)
- vNext now: new choices sort sections.name then courses.code, filtered in returned order (`src/modules/courses/college-learner-progress-service.ts:35-53; src/components/courses/college-learner-progress-report.tsx:24-25`)
- Fix: Match active/semester priority, or document persisted offering recency ordering

## G2-2-015-016  [P2] GAP  facet F05  effort M
- Legacy: legacy classes include all college class list, course list fallback to all before class selection (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:78-85,129-134`)
- vNext now: vNext choices restricted to active section deliveries/active offerings/active sections (`src/modules/courses/college-learner-progress-service.ts:32-53`)
- Fix: Represent eligible legacy classes without active delivery with explicit empty state, not disappear silently

## G2-2-015-017  [P2] GAP  facet F05  effort M
- Legacy: legacy per-student table defaults ascending completion percentage and AntD pagination 20 with size changer (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-194,379-386`)
- vNext now: new report service sorts ascending progress but DataTable has no pagination props (`src/modules/courses/college-learner-progress-service.ts:155-162; src/components/courses/college-learner-progress-report.tsx:78-95`)
- Fix: Add 20-row size-changing table pagination, preserve ascending by progress

## G2-2-015-022  [P2] GAP  facet F06  effort M
- Legacy: legacy metadata read has Retry and no selection while unresolved (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:77-95,297-315`)
- vNext now: vNext server query loads choices together with report and no inline metadata retry (`src/modules/courses/college-learner-progress-service.ts:32-64; src/components/courses/college-learner-progress-report.tsx:33-62`)
- Fix: Offer explicit retry and avoid presenting empty options as certain absence on fetch failure

## G2-2-015-030  [P2] GAP  facet F10  effort M
- Legacy: legacy fetchByCollege courses and getClassesByCollege then faculty assignments-by-class and getCourseProgress (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:5-12,77-125,138-160`)
- vNext now: vNext report joins deliveries/offerings/sections and DB selects per learner (`src/modules/courses/college-learner-progress-service.ts:32-90`)
- Fix: Document endpoint/read-model mapping and include historical teaching assignments appropriately

## G2-2-015-031  [P2] GAP  facet F10  effort M
- Legacy: legacy GET /api/v1/admin/course-progress?courseId=&classId= (`docs/legacy-source/frontend/src/api/Services/AdminService.js:540-543`)
- vNext now: vNext GET page with offeringId+deliveryId through getCollegeLearnerProgressReport (`src/components/courses/college-learner-progress-report.tsx:33-53; src/modules/courses/college-learner-progress-service.ts:56-65`)
- Fix: Map old course/class link parameters to new offering/delivery for existing bookmarks

## G2-2-015-035  [P2] GAP  facet F12  effort M
- Legacy: legacy class courses include inactive past assignments with label · past (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:113-122`)
- vNext now: new choice query only active offerings, sections and non-ended deliveries (`src/modules/courses/college-learner-progress-service.ts:32-53`)
- Fix: Restore optional historical class course records or mark intentionally scoped to active only

## G2-2-015-055  [P2] GAP  facet F20  effort M
- Legacy: legacy class+course numeric parameters from older URLs (`docs/legacy-source/frontend/src/api/Services/AdminService.js:542-543`)
- vNext now: new offeringId and deliveryId must be UUID, strict schema (`src/modules/courses/college-learner-progress-service.ts:16-20,59-65`)
- Fix: Provide compatibility mapping or documented migration for bookmarked links

## G2-2-015-057  [P2] GAP  facet F22  effort M
- Legacy: legacy progress aggregates per learner/class/course IDs returned by API (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-205,207-225`)
- vNext now: vNext section enrollment membership role with course-offering/delivery schema, DB 3 activity sources (`src/modules/courses/college-learner-progress-service.ts:69-161`)
- Fix: Document old class/course-to-offering/delivery ID mapping and active-enrollment policy

## G2-2-015-058  [P2] GAP  facet F22  effort M
- Legacy: legacy visual counts videos watched to end, submissions and attempts (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:18-28,166-205`)
- vNext now: vNext visibility predicates require published and visible content and active audience (`src/modules/courses/college-learner-progress-service.ts:92-120`)
- Fix: Compare denominator treatment of hidden/draft/historical content; clearly explain intentional filtering

## G2-4-019-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy bulk response deduplicates positive content IDs and preserves caller order. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:205-231`)
- vNext now: New GET targets one content and college report batches SQL queries, not per-learner bulk endpoint. (`src/app/api/courses/progress/[contentId]/route.ts:16-37`; `src/modules/courses/college-learner-progress-service.ts:125-144`)
- Fix: Offer scoped bulk progress endpoint where old lesson player expects one call.

## G2-4-019-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy bulk max IDs default500 and rejects excess without truncation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:24-29`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:218-224`)
- vNext now: New college report limits Section to2000 students and queries item sets separately. (`src/modules/courses/college-learner-progress-service.ts:69-92`; `src/modules/courses/college-learner-progress-service.ts:125-144`)
- Fix: Preserve explicit completeness warning when scoped count exceeds safe cap.

## G2-8-008-015  [P2] GAP  facet F05  effort M
- Legacy: legacy course dropdown sorts active first then most recent semester (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:113-122`)
- vNext now: new choices sort sections.name then courses.code, filtered in returned order (`src/modules/courses/college-learner-progress-service.ts:35-53; src/components/courses/college-learner-progress-report.tsx:24-25`)
- Fix: Match active/semester priority, or document persisted offering recency ordering

## G2-8-008-016  [P2] GAP  facet F05  effort M
- Legacy: legacy classes include all college class list, course list fallback to all before class selection (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:78-85,129-134`)
- vNext now: vNext choices restricted to active section deliveries/active offerings/active sections (`src/modules/courses/college-learner-progress-service.ts:32-53`)
- Fix: Represent eligible legacy classes without active delivery with explicit empty state, not disappear silently

## G2-8-008-017  [P2] GAP  facet F05  effort M
- Legacy: legacy per-student table defaults ascending completion percentage and AntD pagination 20 with size changer (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:187-194,379-386`)
- vNext now: new report service sorts ascending progress but DataTable has no pagination props (`src/modules/courses/college-learner-progress-service.ts:155-162; src/components/courses/college-learner-progress-report.tsx:78-95`)
- Fix: Add 20-row size-changing table pagination, preserve ascending by progress

## G2-8-008-022  [P2] GAP  facet F06  effort M
- Legacy: legacy metadata read has Retry and no selection while unresolved (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:77-95,297-315`)
- vNext now: vNext server query loads choices together with report and no inline metadata retry (`src/modules/courses/college-learner-progress-service.ts:32-64; src/components/courses/college-learner-progress-report.tsx:33-62`)
- Fix: Offer explicit retry and avoid presenting empty options as certain absence on fetch failure

## G2-8-008-030  [P2] GAP  facet F10  effort M
- Legacy: legacy fetchByCollege courses and getClassesByCollege then faculty assignments-by-class and getCourseProgress (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:5-12,77-125,138-160`)
- vNext now: vNext report joins deliveries/offerings/sections and DB selects per learner (`src/modules/courses/college-learner-progress-service.ts:32-90`)
- Fix: Document endpoint/read-model mapping and include historical teaching assignments appropriately

## G2-8-008-031  [P2] GAP  facet F10  effort M
- Legacy: legacy GET /api/v1/admin/course-progress?courseId=&classId= (`docs/legacy-source/frontend/src/api/Services/AdminService.js:540-543`)
- vNext now: vNext GET page with offeringId+deliveryId through getCollegeLearnerProgressReport (`src/components/courses/college-learner-progress-report.tsx:33-53; src/modules/courses/college-learner-progress-service.ts:56-65`)
- Fix: Map old course/class link parameters to new offering/delivery for existing bookmarks

## G2-8-008-035  [P2] GAP  facet F12  effort M
- Legacy: legacy class courses include inactive past assignments with label · past (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:113-122`)
- vNext now: new choice query only active offerings, sections and non-ended deliveries (`src/modules/courses/college-learner-progress-service.ts:32-53`)
- Fix: Restore optional historical class course records or mark intentionally scoped to active only

## G2-8-008-055  [P2] GAP  facet F20  effort M
- Legacy: legacy class+course numeric parameters from older URLs (`docs/legacy-source/frontend/src/api/Services/AdminService.js:542-543`)
- vNext now: new offeringId and deliveryId must be UUID, strict schema (`src/modules/courses/college-learner-progress-service.ts:16-20,59-65`)
- Fix: Provide compatibility mapping or documented migration for bookmarked links

## G2-8-008-057  [P2] GAP  facet F22  effort M
- Legacy: legacy progress aggregates per learner/class/course IDs returned by API (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-205,207-225`)
- vNext now: vNext section enrollment membership role with course-offering/delivery schema, DB 3 activity sources (`src/modules/courses/college-learner-progress-service.ts:69-161`)
- Fix: Document old class/course-to-offering/delivery ID mapping and active-enrollment policy

## G2-8-008-058  [P2] GAP  facet F22  effort M
- Legacy: legacy visual counts videos watched to end, submissions and attempts (`docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:18-28,166-205`)
- vNext now: vNext visibility predicates require published and visible content and active audience (`src/modules/courses/college-learner-progress-service.ts:92-120`)
- Fix: Compare denominator treatment of hidden/draft/historical content; clearly explain intentional filtering

## G2-2-015-081  [P3] GAP  facet F12  effort S
- Legacy: Legacy equal progress ties preserve active roster database order `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:188-211`
- vNext now: College explicitly breaks ties by string name `src/modules/courses/college-learner-progress-service.ts:155-162`
- Fix: Document tie-sort decision; match historical order where strict parity matters

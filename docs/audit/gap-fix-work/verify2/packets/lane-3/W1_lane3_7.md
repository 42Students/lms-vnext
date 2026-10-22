# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-17-006-051 [P1] GAP facet F22
- Files: src/modules/courses/learner-course-service.ts, src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx
- Legacy: docs/legacy-source/frontend/src/utils/learnerCourseDetail.js:2-16 course identity integer/slug, courseDTO active/enabled/published flags; docs/legacy-source/frontend/src/utils/courseUtils/contentAvailability.js:47-84 client availability.
- Expected fix: Document legacy course↔vNext offering↔delivery mapping and historical-visibility policy; no data migration but old bookmarks decision.

## G2-17-008-011 [OK] GAP facet F03
- Files: src/components/courses/lesson-resource-materials-control.tsx
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:170-176 — FILE Open and LINK Open are similarly named; unavailable has text.
- Expected fix: Provide signed FILE Open action, consistent unavailable handling.

## G2-17-008-022 [P1] GAP facet F06
- Files: src/components/courses/lesson-resource-materials-control.tsx
- Legacy: docs/legacy-source/frontend/src/components/Global/Offcanvas/Syallabus/ResourceComposer.js:235-240 — Admin may switch class/shared only before files added.
- Expected fix: Add safe shared/class selector where authorised.

## G2-17-008-035 [DEFERRED — link edit exists; FILE edit parity needs scoped design] GAP facet F09
- Files: src/components/courses/lesson-resource-materials-control.tsx
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:183-188 — Edit Resource passes existing data and refresh callback.
- Expected fix: Provide complete existing Resource editor.

## G2-17-008-050 [OK] MISSING facet F13
- Files: src/components/courses/lesson-resource-materials-control.tsx
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:69-91 — Opening by material index has individual loading/disabled guard.
- Expected fix: Add per-file pending/timeout handling.

## G2-17-008-055 [OK] GAP facet F14
- Files: src/components/courses/lesson-resource-materials-control.tsx
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:174-176 — Every healthy FILE shows Open; unavailable shows fallback.
- Expected fix: Restore secure Open/Download CTA for READY files.

## G2-17-008-067 [DEFERRED — conflicts with same-tab/no-popup policy] MISSING facet F19
- Files: src/components/courses/lesson-resource-materials-control.tsx
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:69-75 — Opens blank browser tab synchronously to avoid popup blocker.
- Expected fix: Reserve safe blank tab synchronously before signing.

## G2-17-008-069 [DEFERRED — popup fallback forbidden by same-tab policy] MISSING facet F20
- Files: src/components/courses/lesson-resource-materials-control.tsx
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:76-91 — If popup blocked, current page navigates; on failure popup closes.
- Expected fix: Implement popup-block fallback and cleanup.

## G2-17-016-017 [OK — MULTIPLE_CHOICE requires at least one correct; all-correct allowed] GAP facet F07
- Files: src/modules/courses/quiz-validation.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:881-882 — Legacy multiple choice requires >=1 correct (all-correct permitted).
- Expected fix: Document intentional all-correct restriction or restore legacy rule.

## G2-17-003-008 [OK — global video policy shown without college selection] MISSING facet F03
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:38-65 no-college displays warning and optionally Video policy card for type=video.
- Expected fix: Render platform-global watched-threshold policy even when college is unselected on Videos route.

## G2-17-003-012 [P1] GAP facet F04
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:224-280 reads by selected course/lesson/class, with class ID 0 generic and class-specific views.
- Expected fix: Map legacy course/lesson/class scopes into offering/lesson/delivery query and preselect when entering old link.

## G2-17-003-018 [P1] GAP facet F06
- Files: src/components/courses/super-admin-content-authoring.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:539-647 author form has title, type, lesson, points, order, audience, duration/link/upload and scheduling fields.
- Expected fix: Audit and fill missing VIDEO author fields and distinct class-audience controls.

## G2-17-003-021 [P1] MISSING facet F07
- Files: src/components/courses/super-admin-content-authoring.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:468-490 validates video import URL http/https and provides validation/import-specific toasts.
- Expected fix: Add validation/import URL flow with exact failure/size/info messages and safe server importer.

## G2-17-003-025 [P1] MISSING facet F08
- Files: src/components/courses/super-admin-content-authoring.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:435-438 video upload success '${file.name} uploaded successfully!' and error 'Upload failed:...'.
- Expected fix: Support upload and progress/toast feedback once secure storage actor is ready.

## G2-17-003-029 [P1] GAP facet F10
- Files: src/components/courses/super-admin-content-directory-page.tsx, src/modules/courses/lesson-content-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:70-74 switches rendered components by query; docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:532-669 then calls createLessonContent/getLessonContents and R2 presign.
- Expected fix: Build old VIDEO upload plus content linking and server-side scoped authoring, retain schema compatibility.

## G2-17-003-032 [OK — GLOBAL policy link restricted to Super Admin] GAP facet F11
- Files: src/components/courses/super-admin-content-directory-page.tsx, src/modules/platform-settings/legacy-setting-specs.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:48-61 platform-wide video policy editable with no college selected, scopeType='GLOBAL'.
- Expected fix: Offer global policy on no-college screen and restrict edits to privileged Super Admin.

## G2-17-003-034 [P1] GAP facet F12
- Files: src/components/courses/super-admin-content-authoring.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:146-150 selectedClassIdForView 0 generic; :641-647 allows content scoped to one class or all.
- Expected fix: Expose Section-specific audience selector and class/section content edit path.

## G2-17-003-049 [P1] GAP facet F20
- Files: src/components/courses/super-admin-content-authoring.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:162-166 upload target binds file to 'new' or specific edit ID to prevent cross-item media mixup.
- Expected fix: Carry upload/edit target isolation into admin video uploader if implemented.

## G2-17-003-051 [P1] GAP facet F21
- Files: src/components/courses/super-admin-content-authoring.tsx, src/modules/courses/lesson-content-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:400-447 integrates presigned R2 and URL import (first party storage); no scheduling job in wrapper.
- Expected fix: Complete secure upload integration rather than replacing it with informational paragraph.

## G2-17-003-054 [P1] MISSING facet F23
- Files: src/components/courses/super-admin-content-directory-page.tsx, src/modules/courses/super-admin-content-directory-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:48-63 Video policy accessible with no college selected and separate resources/live component by query.
- Expected fix: Restore no-college global policy and add old deep-link alias.

## G2-17-002-062 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/semester-courses/error.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:387-390 failed refresh keeps last-good same-semester mappings, alert 'Couldn't refresh semester course mapping'.
- Expected fix: Keep last-good per-term records during refresh failure and display stale-warning rather than blank whole page.

## G2-18-007-028 [P1] GAP facet F06
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old Video create has separate Faculty selector and Audience (all/specific), Content Type and visible-to-students switch (`LessonContent.js:1170-1299,1545-1556`).
- Expected fix: Restore each authoring input and persist faculty/visibility state.

## G2-18-007-031 [P1] GAP facet F06
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old video supports separate importVideoFromUrl and validateVideoUrl methods (`LessonContent.js:5,168-171`).
- Expected fix: Distinguish video file-from-URL import vs linked YouTube authoring.

## G2-18-007-035 [P1] GAP facet F06
- Files: src/components/courses/college-content-authoring-control.tsx, src/components/courses/college-content-aggregate.tsx
- Legacy: Old visibility switch default true in Video and Resource create (`LessonContent.js:1553-1556`; `AdminResources.js:404-405`).
- Expected fix: Expose Visible to students in create/edit; persist atomically.

## G2-18-007-037 [P1] GAP facet F07
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old Resource title max255 and exact error `Choose a course/lesson and enter a Resource title (1–255 characters).` (`AdminResources.js:255-259,383-384`).
- Expected fix: Set correct 255 max & validation copy for RESOURCE.

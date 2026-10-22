# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-002-004 [P1] MISSING facet F01
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: No scoped college still shows GLOBAL watched threshold Video policy card `docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:38-63`
- Expected fix: Restore Super Admin GLOBAL `course.watchedThresholdPercent` editor in no-college Videos state.

## G2-19-002-012 [P1] MISSING facet F03
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Legacy export/refresh toolbar embedded in Existing Content Card `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1573-1594`
- Expected fix: Add CSV export + explicit refresh actions with legacy placement.

## G2-19-002-017 [P1] GAP facet F04
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Legacy file preview uses public https link or authenticated `/file/stream` key resolver `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:985-1026`
- Expected fix: Offer audited private playback/download via signed URLs where authorized; don't expose private storage keys.

## G2-19-002-027 [P1] GAP facet F06
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-authoring.tsx
- Legacy: Legacy creation first requires `Course`, `Lesson`, `Faculty` as separate selectors `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1170-1231`
- Expected fix: Offer separate Course/Lesson/Faculty fields and selected-college options as legacy.

## G2-19-002-031 [P1] GAP facet F06
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-authoring.tsx
- Legacy: Legacy `Faculty` is required with exact message `Select a faculty member` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1220-1230`
- Expected fix: Add verified faculty attribution or document immutable `createdByUserId` decision.

## G2-19-002-032 [P1] GAP facet F06
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-authoring.tsx, src/modules/courses/lesson-video-service.ts
- Legacy: Legacy Video length auto from uploaded browser file or InputNumber 1-86400 `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:400-408` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1341-1355`
- Expected fix: Offer duration prefill plus field on binary flow once restored.

## G2-19-002-046 [P1] MISSING facet F08
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Legacy reorder success `Order updated for this class.` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:949-961`
- Expected fix: Implement reorder feedback with view-staleness guard.

## G2-19-002-052 [P1] GAP facet F10
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-actions.tsx
- Legacy: Legacy PUT `/api/v1/lesson/contents/update/{id}` and DELETE `/delete/{id}` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:665-732`
- Expected fix: Document soft-delete/archive, publish state, and old-link route compatibility.

## G2-19-002-055 [P1] GAP facet F10
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-directory-page.tsx, src/modules/courses/lesson-video-service.ts
- Legacy: Legacy content URL open backed by `getFileUrl` authenticated stream for bare keys `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1008-1026`
- Expected fix: Add permissioned transient playback URL action for private file-backed content.

## G2-19-002-068 [P1] MISSING facet F14
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Legacy content export file `lesson-content.csv` with 9 named fields including points/deadline/active/enabled `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1575-1592`
- Expected fix: Add CSV endpoint/toolbar with exactly legacy field names and filtered lesson/class scope.

## G2-19-002-078 [P1] MISSING facet F17
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-authoring.tsx
- Legacy: Legacy upload drag zone visible click/drag instructions and `Progress` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1368-1400`
- Expected fix: Restore keyboard file picker + dropzone progress semantics.

## G2-19-002-080 [P1] MISSING facet F18
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Legacy `The video "watched" threshold is platform-wide` with instruction to clear college `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1132-1142`
- Expected fix: Restore exact policy warning and unscoped editing link.

## G2-19-002-086 [P1] MISSING facet F20
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Legacy late class reorder response ignored if view changed `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:949-959`
- Expected fix: Add selected lesson/delivery version/snapshot to ignore stale reorder confirmations.

## G2-19-002-087 [P1] GAP facet F20
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-actions.tsx
- Legacy: Legacy upload targets new vs edited content, protects against reusing another file `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:426-428` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:798-807`
- Expected fix: Implement target-bound video replacement and stale upload guard with private file lifecycle.

## G2-19-002-090 [P1] GAP facet F21
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-authoring.tsx, src/modules/courses/lesson-video-service.ts
- Legacy: Legacy AdminService imports validateVideoUrl/importVideoFromUrl/R2 upload `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:5-26` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:467-528`
- Expected fix: Map presigned upload, stored-object cleanup, secure validation and URL import integration contracts.

## G2-19-002-091 [P1] GAP facet F21
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Legacy class ordering uses dnd-kit and backend ClassContentOrderRequest `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:8-24` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:617-632`
- Expected fix: Attach audited order service to selected-section full content view.

## G2-19-002-100 [P1] MISSING facet F23
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/components/courses/super-admin-content-directory-page.tsx
- Legacy: Legacy Videos unscoped global threshold card only when college not selected `docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:38-63`
- Expected fix: Return global policy editor under clear-college state, preserving unscoped write guards.

## G2-19-016-015 [P1] GAP facet F06
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/modules/courses/quiz-validation.ts, src/modules/courses/quiz-attempt-service.ts
- Legacy: Legacy submit requires nonempty answer request and one answer for every question `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:552-579`
- Expected fix: Decide complete-answer requirement; don't silently change unanswered scoring semantics.

## G2-19-016-017 [P1] GAP facet F06
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/modules/courses/quiz-attempt-service.ts
- Legacy: Legacy single choice requires exactly one selected `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:580-587`
- Expected fix: Align required single-choice selection with product policy.

## G2-2-006-035 [P1] GAP facet F10
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: (none, new feature)
- Legacy: LS:245-272 prevents deadline/points/resources/audience changes after learner submissions
- Expected fix: Support legacy title-only edits; preserve all other post-submission immutable fields.

## G2-2-008-037 [P1] GAP facet F19
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: (none, new feature)
- Legacy: LC:48-49 <=1000 records via single PageRequest; no unbounded processing
- Expected fix: Bound calls by max records/work budget, provide progress + resumable cursor.

## G2-2-011-027 [P1] GAP facet F10
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: (none, new feature)
- Legacy: LC:41-45 inherits ClassScheduleService full conflicts/max-duration validation
- Expected fix: Audit equivalent max-duration and multi-course schedule clash rules beyond simple overlap.

## G2-2-014-007 [P1] GAP facet F04
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: (none, new feature)
- Legacy: LC:146-151 requested,updatedCount,failed[{courseId,reason}]
- Expected fix: Report per COURSE updated/failed and reasons, not only content-level changes.

## G2-2-015-064 [P1] MISSING facet F04
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Six student columns include Roll number between Student and Videos `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:166-205`
- Expected fix: Join learnerProfiles.roll_number and add Roll number to details and export

## G2-2-015-089 [P1] GAP facet F19
- Verification: DEFERRED — Requires service/wiring or product-policy verification beyond a matching UI signal.
- Files: src/modules/courses/super-admin-student-course-progress.ts, src/app/(authenticated)/admin/course-progress/students/page.tsx
- Legacy: Backend retrieves full active class roster and returns all rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminCourseProgressController.java:132-134,185-215`
- Expected fix: Use server pagination with exact counts and full CSV; never compute global mean from capped page

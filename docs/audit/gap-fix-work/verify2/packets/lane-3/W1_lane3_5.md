# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-018-026 [P1] GAP facet F10
- Files: src/modules/courses/lesson-service.ts
- Legacy: PATCH/update can modify name, flags, course, sequence (`LessonServiceImpl.java:268-350`).
- Expected fix: Close remaining active/enabled and cross-course move parity; avoid accidental data loss on DTO remap.

## G2-18-018-027 [P1] GAP facet F10
- Files: src/modules/courses/lesson-service.ts
- Legacy: Delete soft-archives lesson AND active child rows with deletedWithLesson=true (`LessonServiceImpl.java:354-371`).
- Expected fix: Confirm descendants inaccessible while parent archived and restoring restores exactly parent-deleted child subset; consider provenance marker for independently archived content.

## G2-18-021-046 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: Old DTO Lombok getters/all-args constructor with field `type` added to fix primary/fallback classification drift (DTO:11-29)
- Expected fix: Write explicit typed job-date projection contract + fixture for primary/fallback classification agreement

## G2-14-002-050 [P1] MISSING facet F09
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy Profile — Name width860 with ProfileSectionsPanel; vNext no row profile popup — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1765-1775`
- Expected fix: Add 860px learner section viewer

## G2-14-008-065 [P1] GAP facet F22
- Files: src/modules/courses/progress-service.ts
- Legacy: Legacy learner_content_progress PK keyed learnerId/int lessonContentId, with percentWatched; vNext by membershipId/UUID lessonContentId, computed percent from authored duration — `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:68-85,121-156`; `docs/legacy-source/frontend/src/components/Course/Syllabus/ContentProgressBadge.jsx:19-26`
- Expected fix: Document data mapping of resume/percent/completedAt and legacy ID migration/test fixtures

## G2-14-021-002 [P1] GAP facet F01
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy module access evaluator resolves learner to global chain `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:59-61` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:174-207`
- Expected fix: Define replacement for 8-level learner entitlements and nav

## G2-14-021-006 [P1] GAP facet F03
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy exposes module locked/enabled decisions at every applicable scope `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:344-390`
- Expected fix: Preserve locked parent overrides and reason text in UI

## G2-14-021-011 [P1] GAP facet F05
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy bulk scope-type grouped read supports many learner overrides `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:186-213`
- Expected fix: Restore batched learner/class/batch module override listing

## G2-14-021-027 [P1] GAP facet F11
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy settings resolution applies learner to global ancestors `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:174-207` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:380-390`
- Expected fix: Preserve authorization and effective policy across all role/learner scopes

## G2-14-021-028 [P1] GAP facet F11
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy module fail closed on unavailable/conflicting setting `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:311-326` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:349-370`
- Expected fix: Ensure every runtime entitlement consumer fails closed, not editor alone

## G2-14-021-030 [P1] GAP facet F12
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy module decisions follow most specific chain and lock semantics `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:344-390`
- Expected fix: Implement matching nearest override and ancestor locked semantics

## G2-14-021-038 [P1] GAP facet F15
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy module keys control availability for users `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleAccessResolver.java:380-390`
- Expected fix: Wire settings to runtime module gates and warn if unconsumed

## G2-14-021-049 [P1] GAP facet F21
- Files: src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy settings consumed by modules, auth cookies, OTP, interview policy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AppSettingsService.java:45-89`
- Expected fix: Audit consumers of each key and integrate safe configuration activation

## G2-15-002-044 [P1] MISSING facet F09
- Files: src/app/(authenticated)/admin/placements/student-lookup/page.tsx
- Legacy: Profile edit inline shows Save/Cancel and disables cancel during save (`ProfileSectionsPanel.js:281-313,426-435`).
- Expected fix: Implement inline edit view with pending semantics and cancel.

## G2-15-003-030 [P1] MISSING facet F06
- Files: src/components/courses/super-admin-lesson-create.tsx, src/db/schema/courses.ts
- Legacy: Visible to students switch defaults on; help `Off hides this lesson and its content from students; staff still see it.` (`sections/Lessons.js:56-61,423-425`).
- Expected fix: Add default-on switch with exact help and map active/enabled/visible fields.

## G2-15-003-037 [P1] GAP facet F07
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Edit dirty-close opens `Discard edits to “lesson”?` with `Unsaved changes will be lost.` (`sections/Lessons.js:294-302`).
- Expected fix: Track initial edit snapshot; confirm before discarding dirty fields, preserve exact title/body.

## G2-15-003-038 [P1] GAP facet F07
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Delete requires exact lesson name typed before Delete enabled (`sections/Lessons.js:542-555`).
- Expected fix: Restore typed-name confirmation for destructive archive/delete if semantics warrant, or document equivalence exception.

## G2-15-003-045 [P1] GAP facet F09
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Delete Modal title `Delete lesson`, warning `Students and teachers lose this lesson straight away`, notes files/progress kept, typed name (`sections/Lessons.js:542-555`).
- Expected fix: Clone full confirmation/warning retention semantics or write explicit archive-vs-delete owner decision.

## G2-15-003-049 [P1] GAP facet F10
- Files: src/components/courses/super-admin-lesson-create.tsx
- Legacy: Create `POST /api/v1/lesson/create` payload courseId, name, active/enabled true, sequence0 (`AdminService.js:560-564`; `sections/Lessons.js:255-269`).
- Expected fix: Map legacy course→eligible offering/path and student visibility; avoid race in sequence append.

## G2-15-003-050 [P1] GAP facet F10
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Edit `PUT /api/v1/lesson/update/{id}` name/course/sequence/active/enabled (`AdminService.js:576-577`; `sections/Lessons.js:303-315`).
- Expected fix: Restore scoped course change and visible controls or document changed domain semantics.

## G2-15-003-051 [P1] GAP facet F10
- Files: src/components/courses/admin-learning-structure-actions.tsx, src/db/schema/courses.ts
- Legacy: Delete `DELETE /api/v1/lesson/delete/{id}` and recoverability via `/deleted`,`/restore/{id}` (`AdminService.js:579-588`; `LessonController.java:573-643`).
- Expected fix: Add archive restore workflow and exact retention semantics; ensure content/work history recoverable.

## G2-15-003-081 [P1] GAP facet F20
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Delete guard disables until exact typed lessonName; submit busyRef and deleteLoading (`sections/Lessons.js:334-344,542-555`).
- Expected fix: Implement explicit destructive-action guard and last-moment permission revalidation.

## G2-15-003-089 [P1] GAP facet F23
- Files: src/components/courses/super-admin-lesson-create.tsx, src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Legacy create/edit requires visibility switch, edit course move, typed delete; details as described (`sections/Lessons.js:37-63,284-344,531-555`).
- Expected fix: Make owner decision matrix and implement missing lifecycle/edit safeguards before marking parity.

## G2-15-005-052 [P1] MISSING facet F13
- Files: (none, new feature)
- Legacy: Legacy unknown lookup full page with `Application status unavailable`, `Check status again` (VerifiedJobDetailContent.jsx:60-89)
- Expected fix: Render matching retry state on indeterminate user-application read

## G2-15-006-038 [P1] GAP facet F10
- Files: src/modules/courses/learner-course-service.ts
- Legacy: Legacy user class+semester course fetch `getLearnerCourses` and semester GET (`CoursesContent.jsx:117-126,183-202)
- Expected fix: Document current-vs-historical active course target and elective enrolment criteria crosswalk

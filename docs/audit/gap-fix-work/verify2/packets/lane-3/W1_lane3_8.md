# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## [x] G2-18-007-039 [P1] MISSING facet F07
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old resource max20 materials, 13 allowed extensions, 50MB/file (`AdminResources.js:18-19,210-219`).
- Expected fix: Enforce max20, ext/MIME and 50MB both UI and API for new resources.

## [x] G2-18-007-046 [P1] GAP facet F09
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old Resources `Add Resource`/`Edit Resource` modal and discard confirmation `Discard the changes to this resource?` (`AdminResources.js:179-208,379-380`).
- Expected fix: Add dirty snapshot + confirm and modal focus handling.

## [x] G2-18-007-047 [P1] GAP facet F09
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old Video edit modal `Edit Content: {title}`, width600 and `Discard lesson-content edits?` (`LessonContent.js:748-761,1720-1730`).
- Expected fix: Restore modal heading and discard confirmation on close.

## [x] G2-18-007-064 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/videos/page.tsx, src/components/courses/college-content-authoring-control.tsx
- Legacy: Old video dependency errors show Courses/Faculty/Lessons/Sections unavailable with Retry (`LessonContent.js:1148-1155`).
- Expected fix: Add independent dependency error states/retry in authoring card.

## [x] G2-18-007-078 [P1] GAP facet F20
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old class change clears previous resource rows and invalidates request seq (`AdminResources.js:111-169`).
- Expected fix: Request filtered results server-side, guard late responses.

## [x] G2-18-007-079 [P1] GAP facet F20
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old dirty Edit modal prompts on Cancel, preserving unsaved file replacement (`LessonContent.js:748-761`).
- Expected fix: Track dirty state and confirm discard; abort pending upload safely.

## [x] G2-18-007-080 [P1] GAP facet F20
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old timezone picker uses IANA zones including DST (`LessonContent.js:1525-1537`).
- Expected fix: Support full IANA timezone conversion with ambiguous DST boundary handling.

## [x] G2-18-007-081 [P1] GAP facet F21
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old integrations R2 presign, import-from-URL, YouTube, Zoom/Meet (`LessonContent.js:5,25,400-435,1453-1467`).
- Expected fix: Wire storage/import/proxy integrations with strict authorization.

## [x] G2-18-007-082 [P1] GAP facet F21
- Files: src/components/courses/college-content-authoring-control.tsx
- Legacy: Old Resource mixed FILE/LINK metadata (`AdminResources.js:26-45,225-238`).
- Expected fix: Support upload receipt attachment and separate material links in one create action.

## [x] G2-18-007-085 [P1] GAP facet F22
- Files: src/components/courses/college-content-authoring-control.tsx, src/db/schema/courses.ts
- Legacy: Old class-specific ordering managed separately from content sequence (`LessonContent.js:940-965`).
- Expected fix: Introduce section-specific ordered content mapping and concurrency token.

## [x] G2-18-002-035 [P1] GAP facet F06
- Files: src/components/courses/super-admin-lesson-create.tsx, src/db/schema/courses.ts
- Legacy: Legacy Create has one student visibility switch default ON and explanatory helper `Off hides this lesson and its content...`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:423-425`
- Expected fix: Expose default ON toggle and pass explicit visibility at creation when user switches it off.

## [x] G2-18-002-036 [P1] GAP facet F06
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Legacy lesson edit allows moving course via course Select. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:284-294`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:303-320`
- Expected fix: Offer safe move wizard requiring destination offering/path migration and permission checks or record intentional removal.

## [x] G2-18-002-039 [P1] GAP facet F06
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Legacy edit cancellation with unsaved form displays Discard edits confirm; during save shows Wait for the lesson save to finish. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:294-302`
- Expected fix: Implement snapshot-based dirty guard and pending-save close disable, exact confirm copy.

## [x] G2-18-002-040 [P1] GAP facet F06
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Legacy delete requires typing exact lesson name to enable danger button. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:542-554`
- Expected fix: If destructive equivalent, require matching name; if reversible archive, clearly label reduced-risk action and preserve undo/history.

## [x] G2-18-002-058 [P1] GAP facet F09
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Legacy delete Modal has warning `Students and teachers lose this lesson straight away`, preserved uploads/progress, typed name, danger CTA mislabeled `Delete lesson and its files`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:542-554`
- Expected fix: Do not mimic misleading `and its files`; preserve meaningful impact warning, typed confirmation only if destructive.

## [x] G2-18-002-060 [P1] GAP facet F09
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Legacy edit cancel dirty-confirm modal `Discard edits to “NAME”?` buttons Discard edits. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:294-302`
- Expected fix: Wire dirty state and confirm before discarding.

## [x] G2-18-002-110 [P1] GAP facet F20
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Legacy edit double-submit guarded refs, dirty discard confirmation, wait-on-save toast. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:294-330`
- Expected fix: Block close while save in flight, snapshot original values and prompt only when dirty.

## [x] G2-18-002-114 [P1] GAP facet F20
- Files: src/components/courses/admin-learning-structure-actions.tsx
- Legacy: Legacy edit can change course; backend has transaction validations for move vs duplicate. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:303-319`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:278-297`
- Expected fix: Decide if scoped move is required; if yes transactionally move content and preserve learner records.

## [x] G2-18-003-031 [P1] GAP facet F05
- Files: src/components/courses/admin-course-actions.tsx, src/components/courses/admin-course-overview.tsx
- Legacy: Legacy delete disabled if dependencies lessonCount >0; otherwise server checks. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`
- Expected fix: Show both linked lessons and active offerings blockers, with status-specific reason.

## [x] G2-18-003-034 [P1] GAP facet F06
- Files: src/modules/courses/validation.ts
- Legacy: Legacy Short display name required max64, placeholder DSA. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:50-55`
- Expected fix: Retain required at UX (max64) or explicitly document 120/optional product change.

## [x] G2-18-003-035 [P1] GAP facet F06
- Files: src/modules/courses/validation.ts
- Legacy: Legacy Official course code optional max40, placeholder CS101. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:58-61`
- Expected fix: Avoid mapping blank legacy official code to required primary code incorrectly; preserve fallback semantics.

## [x] G2-18-003-036 [P1] MISSING facet F06
- Files: src/modules/courses/validation.ts
- Legacy: Legacy In this Course Heading required max255. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:64-67`
- Expected fix: Add persisted introduction heading and required form field, update read-only course display.

## [x] G2-18-003-042 [P1] GAP facet F06
- Files: src/components/courses/admin-course-actions.tsx
- Legacy: Legacy Edit Department can change, and all original metadata remains untouched if hidden. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:37-40`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:355-375`
- Expected fix: Choose safe department move flow with impact preview or approved immutability rationale.

## [x] G2-18-003-046 [P1] GAP facet F07
- Files: src/modules/courses/validation.ts
- Legacy: Legacy Code input max40 optional; no pattern except image/colour. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:58-61`
- Expected fix: Document stricter code constraint; accept legacy persisted values or migration normalization, do not reject equivalent edit unexpectedly.

## [x] G2-18-003-100 [P1] MISSING facet F19
- Files: src/components/courses/admin-course-create-panel.tsx
- Legacy: Legacy image upload async presign can outlive scope but sequence token ignores stale result. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:185-211`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:214-254`
- Expected fix: When adding upload, fence by collegeId and abort/ignore stale results.


Verification notes (lane chat-11): All 25 items inspected against their legacy references and vNext code. Shared section order now uses an expected-order concurrency snapshot; its DB05 rollout remains fail-closed until the verified migration flag is enabled. Video URL import is intentionally not carried over under `docs/architecture/file-and-video-storage.md` (private signed upload and approved YouTube/meeting links remain supported).

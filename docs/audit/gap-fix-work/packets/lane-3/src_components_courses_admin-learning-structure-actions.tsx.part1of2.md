# Work packet: edit src/components/courses/admin-learning-structure-actions.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md

## G2-15-003-033  [P1] GAP  facet F06  effort L
- Legacy: Edit modal retains course selector and visible switch, name; sequence unchanged in payload (`sections/Lessons.js:284-316,531-540`).
- vNext now: Edit modal changes name, description and numeric Order; no course reassignment or visibility switch (`admin-learning-structure-actions.tsx:516-609`).
- Fix: Restore course reassignment and visible control; move direct order edit to reorder tool.

## G2-15-003-037  [P1] GAP  facet F07  effort M
- Legacy: Edit dirty-close opens `Discard edits to “lesson”?` with `Unsaved changes will be lost.` (`sections/Lessons.js:294-302`).
- vNext now: Dialog onOpenChange closes whenever !pending; no dirty-confirm (`admin-learning-structure-actions.tsx:516-529`).
- Fix: Track initial edit snapshot; confirm before discarding dirty fields, preserve exact title/body.

## G2-15-003-038  [P1] GAP  facet F07  effort M
- Legacy: Delete requires exact lesson name typed before Delete enabled (`sections/Lessons.js:542-555`).
- vNext now: Archive confirm button only, no typed-name safeguard (`admin-learning-structure-actions.tsx:612-633`).
- Fix: Restore typed-name confirmation for destructive archive/delete if semantics warrant, or document equivalence exception.

## G2-15-003-045  [P1] GAP  facet F09  effort M
- Legacy: Delete Modal title `Delete lesson`, warning `Students and teachers lose this lesson straight away`, notes files/progress kept, typed name (`sections/Lessons.js:542-555`).
- vNext now: Archive ConfirmDialog `Archive {name}?`, `active learning items leave current Course surfaces`, no typed confirmation (`admin-learning-structure-actions.tsx:612-633`).
- Fix: Clone full confirmation/warning retention semantics or write explicit archive-vs-delete owner decision.

## G2-15-003-050  [P1] GAP  facet F10  effort L
- Legacy: Edit `PUT /api/v1/lesson/update/{id}` name/course/sequence/active/enabled (`AdminService.js:576-577`; `sections/Lessons.js:303-315`).
- vNext now: PATCH `/api/courses/lessons/{uuid}` name/description/sequence (`admin-learning-structure-actions.tsx:539-554`).
- Fix: Restore scoped course change and visible controls or document changed domain semantics.

## G2-15-003-051  [P1] GAP  facet F10  effort L
- Legacy: Delete `DELETE /api/v1/lesson/delete/{id}` and recoverability via `/deleted`,`/restore/{id}` (`AdminService.js:579-588`; `LessonController.java:573-643`).
- vNext now: DELETE `/api/courses/lessons/{id}` creates ARCHIVED status (`admin-learning-structure-actions.tsx:612-630`; `courses.ts:332-334`).
- Fix: Add archive restore workflow and exact retention semantics; ensure content/work history recoverable.

## G2-15-003-081  [P1] GAP  facet F20  effort M
- Legacy: Delete guard disables until exact typed lessonName; submit busyRef and deleteLoading (`sections/Lessons.js:334-344,542-555`).
- vNext now: Archive confirmation blocks pending only, no typed name (`admin-learning-structure-actions.tsx:612-633`).
- Fix: Implement explicit destructive-action guard and last-moment permission revalidation.

## G2-15-003-089  [P1] GAP  facet F23  effort L
- Legacy: Legacy create/edit requires visibility switch, edit course move, typed delete; details as described (`sections/Lessons.js:37-63,284-344,531-555`).
- vNext now: VNext create default active, edit only name/description/sequence, archive confirm without typing (`super-admin-lesson-create.tsx:21-64`; `admin-learning-structure-actions.tsx:469-635`).
- Fix: Make owner decision matrix and implement missing lifecycle/edit safeguards before marking parity.

## G2-18-002-036  [P1] GAP  facet F06  effort L
- Legacy: Legacy lesson edit allows moving course via course Select. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:284-294`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:303-320`
- vNext now: vNext LessonActions edit only Name, Description and Sequence; offering relationship immutable. `src/components/courses/admin-learning-structure-actions.tsx:516-605`
- Fix: Offer safe move wizard requiring destination offering/path migration and permission checks or record intentional removal.

## G2-18-002-039  [P1] GAP  facet F06  effort M
- Legacy: Legacy edit cancellation with unsaved form displays Discard edits confirm; during save shows Wait for the lesson save to finish. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:294-302`
- vNext now: vNext edit Dialog cancel action closes, dirty detection not evident in LessonActions. `src/components/courses/admin-learning-structure-actions.tsx:516-562`
- Fix: Implement snapshot-based dirty guard and pending-save close disable, exact confirm copy.

## G2-18-002-040  [P1] GAP  facet F06  effort M
- Legacy: Legacy delete requires typing exact lesson name to enable danger button. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:542-554`
- vNext now: vNext Archive Lesson uses ConfirmDialog, no name-typing gate. `src/components/courses/admin-learning-structure-actions.tsx:615-629`
- Fix: If destructive equivalent, require matching name; if reversible archive, clearly label reduced-risk action and preserve undo/history.

## G2-18-002-058  [P1] GAP  facet F09  effort M
- Legacy: Legacy delete Modal has warning `Students and teachers lose this lesson straight away`, preserved uploads/progress, typed name, danger CTA mislabeled `Delete lesson and its files`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:542-554`
- vNext now: vNext archive ConfirmDialog says historical records remain preserved and uses `Archive Lesson`. `src/components/courses/admin-learning-structure-actions.tsx:615-629`
- Fix: Do not mimic misleading `and its files`; preserve meaningful impact warning, typed confirmation only if destructive.

## G2-18-002-060  [P1] GAP  facet F09  effort M
- Legacy: Legacy edit cancel dirty-confirm modal `Discard edits to “NAME”?` buttons Discard edits. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:294-302`
- vNext now: vNext Dialog cancel closes with no snapshot comparison in LessonActions. `src/components/courses/admin-learning-structure-actions.tsx:516-562`
- Fix: Wire dirty state and confirm before discarding.

## G2-18-002-064  [P1] GAP  facet F10  effort L
- Legacy: Legacy update PUT `/api/v1/lesson/update/:id`, mutable course, name, active, enabled, sequence. `docs/legacy-source/frontend/src/api/Services/AdminService.js:576-578`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:303-315`
- vNext now: vNext PATCH `/api/courses/lessons/:id`, updates name/description/sequence but not parent offering. `src/app/api/courses/lessons/[lessonId]/route.ts:16-42`, `src/components/courses/admin-learning-structure-actions.tsx:538-556`
- Fix: Document immutable parent as deliberate change or implement audited move with transactional child data consistency.

## G2-18-002-110  [P1] GAP  facet F20  effort M
- Legacy: Legacy edit double-submit guarded refs, dirty discard confirmation, wait-on-save toast. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:294-330`
- vNext now: vNext mutation hook tracks pending but no dirty-state guard in action component. `src/components/courses/admin-learning-structure-actions.tsx:43-75`, `src/components/courses/admin-learning-structure-actions.tsx:516-562`
- Fix: Block close while save in flight, snapshot original values and prompt only when dirty.

## G2-18-002-114  [P1] GAP  facet F20  effort L
- Legacy: Legacy edit can change course; backend has transaction validations for move vs duplicate. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:303-319`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:278-297`
- vNext now: vNext course/learningPath relationship immutable in mapped Edit dialog. `src/components/courses/admin-learning-structure-actions.tsx:516-605`
- Fix: Decide if scoped move is required; if yes transactionally move content and preserve learner records.

## G2-3-005-040  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:442-473`
- vNext now: `src/components/courses/admin-learning-structure-actions.tsx:659-694`
- Fix: Result release gate depends on deadline and published status; verify boundaries CLOSED, DRAFT and exactly due instant.

## G2-15-003-035  [P2] GAP  facet F07  effort M
- Legacy: Edit name required/<=255 and course required, server-field errors mapped (`sections/Lessons.js:39-50,303-330`).
- vNext now: Button disabled empty name/noninteger order/>10000 but no explicit field error text or course control (`admin-learning-structure-actions.tsx:533-607`).
- Fix: Render inline exact field validation; keep editing course requires scoped permission.

## G2-15-003-041  [P2] GAP  facet F08  effort S
- Legacy: Delete success `Deleted “{name}”. Its uploaded files are kept, so it can be restored if needed.` (`sections/Lessons.js:334-342`).
- vNext now: Generic `Lesson archived` success (`admin-learning-structure-actions.tsx:612-633`).
- Fix: Use accurate action/retention wording grounded in vNext archive behavior.

## G2-18-002-045  [P2] GAP  facet F07  effort M
- Legacy: Legacy moving lesson into another course with duplicate name gives `The other course already has a lesson with this name. Rename it first, or pick another course.` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:278-297`
- vNext now: vNext edit cannot change parent offering at all. `src/components/courses/admin-learning-structure-actions.tsx:516-605`
- Fix: If move restored, retain destination duplicate validation and exact message.

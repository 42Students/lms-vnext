# Work packet (wave 2): edit src/components/courses/admin-learning-structure-actions.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md

## G2-15-003-009  [P2] GAP  facet F03  effort M
- Legacy: Edit and Delete buttons each with icon, direct row action (`sections/Lessons.js:399-404`).
- vNext now: Edit plus More dropdown → Archive (`admin-learning-structure-actions.tsx:494-514`).
- Fix: Match direct `Edit`/`Delete` controls and icons; require owner approval for archive terminology.

## G2-15-003-044  [P2] GAP  facet F09  effort S
- Legacy: Edit Modal title `Edit lesson “{name}”`, width520, `Save Changes` and `Cancel` (`sections/Lessons.js:531-540`).
- vNext now: Dialog generic `Edit Lesson`, Save/Cancel (`admin-learning-structure-actions.tsx:516-530,559-563`).
- Fix: Use record-specific title, width and button copy.

## G2-15-003-072  [P2] GAP  facet F17  effort S
- Legacy: Row Delete aria-label `Delete lesson {name}`, Edit aria-label `Edit lesson {name}`; page table controls (`sections/Lessons.js:399-404`).
- vNext now: Generic Edit button, Archive hidden under More dropdown and `Lesson actions` aria-label (`admin-learning-structure-actions.tsx:494-514`).
- Fix: Restore record-specific accessible actions and visible delete discoverability.

## G2-18-002-009  [P2] GAP  facet F02  effort M
- Legacy: Legacy edit/delete are in row Actions column, not isolated details panels. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:390-405`
- vNext now: vNext per-lesson Actions disclosure nests Edit, Archive, Visibility and Move controls. `src/app/(authenticated)/admin/lessons/page.tsx:102-111`, `src/components/courses/admin-learning-structure-actions.tsx:494-518`
- Fix: Restore visible Edit/Remove button pair in table Actions column; secondary actions can stay in overflow.

## G2-18-002-017  [P2] GAP  facet F03  effort S
- Legacy: Legacy row Edit and Delete buttons include icons and accessible labels with lesson name. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:399-404`
- vNext now: vNext Edit is nested LessonActions; destructive choice is Archive under More dropdown. `src/components/courses/admin-learning-structure-actions.tsx:494-515`, `src/components/courses/admin-learning-structure-actions.tsx:615-629`
- Fix: Surface equivalent Edit/Archive affordance with icon/aria-label and explicitly explain archive replaces soft deletion.

## G2-18-002-037  [P2] GAP  facet F06  effort S
- Legacy: Legacy edit auto-focus? Antd Modal 520px, `Save Changes`/`Cancel`, no mask close while pending. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:531-540`
- vNext now: vNext Dialog with own button row, cancel/save, custom widths. `src/components/courses/admin-learning-structure-actions.tsx:516-560`
- Fix: Match modal width 520 and submit/escape/backdrop dirty-form protections.

## G2-18-002-038  [P2] GAP  facet F06  effort M
- Legacy: Legacy `Visible to students` switch in edit maps both active and enabled simultaneously. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:284-292`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:310-315`
- vNext now: vNext visibility is independent chip action with window.confirm; edit Dialog lacks switch. `src/components/courses/admin-learning-structure-actions.tsx:516-605`, `src/components/courses/college-lesson-visibility-controls.tsx:19-45`
- Fix: Expose visibility toggle in Edit and keep same transactional status update.

## G2-18-002-057  [P2] GAP  facet F09  effort M
- Legacy: Legacy Create form always in fixed Card and edit via 520px Modal. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:410-431`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:531-540`
- vNext now: vNext Create inline in details, edit Dialog via LessonActions. `src/components/courses/super-admin-lesson-create.tsx:39-65`, `src/components/courses/admin-learning-structure-actions.tsx:516-562`
- Fix: Match card/dialog chrome, padding, cancel and close semantics.

## G2-18-002-075  [P2] GAP  facet F12  effort M
- Legacy: Legacy course move detects destination duplicate and preserves nonnegative sequence unless collided. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:278-335`
- vNext now: vNext parent path immutable and sequence 0..10000 validation. `src/components/courses/admin-learning-structure-actions.tsx:516-605`, `src/modules/courses/lesson-service.ts:171-235`
- Fix: Keep parent immutable explicitly, and validate row order uniqueness before edit response.

## G2-18-002-093  [P2] GAP  facet F16  effort M
- Legacy: Legacy table has horizontal scrolling max-content and small touch targets Antd Buttons. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:509-520`
- vNext now: vNext no table, link/Button mobile min height 44px. `src/app/(authenticated)/admin/lessons/page.tsx:65-78`, `src/components/courses/admin-learning-structure-actions.tsx:494-518`
- Fix: Render horizontally scrollable data table on narrow view with 44px hit targets, preserve content density.

## G2-18-002-096  [P2] GAP  facet F17  effort S
- Legacy: Legacy Edit/Delete aria-label includes lesson name, AntD Form labels tied to controls. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:399-404`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:37-60`
- vNext now: vNext LessonActions Edit and More controls inside expandable Actions disclosure. `src/app/(authenticated)/admin/lessons/page.tsx:102-111`, `src/components/courses/admin-learning-structure-actions.tsx:494-518`
- Fix: Ensure action names include row-specific lesson identity in accessible name and focus moves into Dialog.

## G2-18-002-116  [P2] GAP  facet F21  effort M
- Legacy: Legacy API Axios calls Spring REST and Antd message notifications; no direct third-party integration from page. `docs/legacy-source/frontend/src/api/Services/AdminService.js:559-590`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:255-388`
- vNext now: vNext uses same-origin Next routes, Drizzle DB and useToast on actions. `src/app/api/courses/lessons/route.ts:30-51`, `src/app/api/courses/lessons/[lessonId]/route.ts:16-65`, `src/components/courses/admin-learning-structure-actions.tsx:43-75`
- Fix: Document API bridge only for migration links; maintain same scoped side effects.

## G2-3-001-073  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:447-464`
- vNext now: `src/components/courses/admin-learning-structure-actions.tsx:658-694`
- Fix: Use `Release results` / `Withhold results` instead of `Publish results` / `Hide results`; preserve deadline tooltip.

## G2-3-005-052  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:456-473`
- vNext now: `src/components/courses/admin-learning-structure-actions.tsx:665-694`
- Fix: Use Release results/Withhold results, not Publish results/Hide results.

## G2-15-003-047  [P3] GAP  facet F09  effort S
- Legacy: Edit-close while save pending info toast `Wait for the lesson save to finish.` (`sections/Lessons.js:294-298`).
- vNext now: Dialog `dismissible={!pending}` only (`admin-learning-structure-actions.tsx:516-520`).
- Fix: Show progress feedback when user attempts to close pending form.

## G2-15-003-068  [P3] GAP  facet F14  effort S
- Legacy: Lesson files are not uploaded on this directory; delete confirm explicitly says uploads kept (`sections/Lessons.js:542-551`).
- vNext now: No file upload on directory; `Archive` dialog generic preservation (`admin-learning-structure-actions.tsx:612-633`).
- Fix: Preserve explicit files-kept copy if semantics proven.

## G2-18-002-097  [P3] GAP  facet F17  effort S
- Legacy: Legacy typed-delete confirm input label `Type lesson name to confirm permanent file deletion` (misleading, files kept). `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:542-554`
- vNext now: vNext Archive ConfirmDialog accessible title and confirmation. `src/components/courses/admin-learning-structure-actions.tsx:615-629`
- Fix: Avoid incorrect permanent-file-deletion label, preserve explicit irreversible-risk wording only if true.

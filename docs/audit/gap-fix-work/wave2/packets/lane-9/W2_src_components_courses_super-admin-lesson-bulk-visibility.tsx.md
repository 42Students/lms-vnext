# Work packet (wave 2): edit src/components/courses/super-admin-lesson-bulk-visibility.tsx

24 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-2/admin-lesson-bulk-controller.md

## G2-15-003-046  [P2] GAP  facet F09  effort M
- Legacy: Bulk Modal.confirm names up to five selected lessons, says no files deleted (`sections/Lessons.js:381-388`).
- vNext now: Native `confirm` with count only; no selected name preview (`super-admin-lesson-bulk-visibility.tsx:17-25`).
- Fix: Implement accessible custom confirm dialog with first-five lesson names and no-file-delete assurance.

## G2-15-003-076  [P2] GAP  facet F18  effort S
- Legacy: Bulk buttons `Show to students`, `Hide from students`, `Clear selection` (`sections/Lessons.js:493-505`).
- vNext now: `Show selected`, `Hide selected`, implicit select toggle; no clear-selection button (`super-admin-lesson-bulk-visibility.tsx:30-51`).
- Fix: Use exact bulk CTA copy and explicit Clear selection.

## G2-18-002-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy bulk actions strip appears within card, immediately above table after selection. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:493-505`
- vNext now: vNext bulk action appears in independent collapsed `Bulk lesson visibility` Disclosure before articles. `src/app/(authenticated)/admin/lessons/page.tsx:91-92`, `src/components/courses/super-admin-lesson-bulk-visibility.tsx:30-52`
- Fix: Align bulk action placement to selected rows above table; retain accessible count.

## G2-18-002-014  [P2] GAP  facet F03  effort S
- Legacy: Legacy selection count `N selected` and controls Show to students/Hide from students/Clear selection. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:493-505`
- vNext now: vNext bulk disclosure calls controls Show selected/Hide selected, separate Select all on this page. `src/components/courses/super-admin-lesson-bulk-visibility.tsx:30-51`
- Fix: Use exact selection count and three action names; define page-only vs cross-page explicitly.

## G2-18-002-030  [P2] GAP  facet F05  effort M
- Legacy: Legacy selected rows preserved across pagination but cleared on search/course changes. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:241-252`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:434-436`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:509-517`
- vNext now: vNext bulk selection is component-local on currently listed page. `src/components/courses/super-admin-lesson-bulk-visibility.tsx:30-51`
- Fix: Define cross-page selection policy; support preservation or explain page-only behavior in UI.

## G2-18-002-059  [P2] GAP  facet F09  effort S
- Legacy: Legacy bulk uses Antd Modal.confirm with first five selected names and danger mode for hide. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:381-388`
- vNext now: vNext calls window.confirm without selection preview or danger styling. `src/components/courses/super-admin-lesson-bulk-visibility.tsx:17-25`
- Fix: Replace native confirm with accessible modal and show affected record names/count.

## G2-18-002-098  [P2] GAP  facet F17  effort S
- Legacy: Legacy selected rows uses Table rowSelection with preserved keys across pages. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:509-517`
- vNext now: vNext custom checkbox list with page-level selection under bulk Disclosure. `src/components/courses/super-admin-lesson-bulk-visibility.tsx:30-49`
- Fix: Announce selected count in status region and keyboard tab order; define page-limit behavior.

## G2-18-002-101  [P2] GAP  facet F18  effort S
- Legacy: Legacy switch `Visible to students`, helper `Off hides this lesson and its content from students; staff still see it.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`
- vNext now: vNext create omits switch; list uses `Bulk lesson visibility` wording. `src/components/courses/super-admin-lesson-create.tsx:42-63`, `src/components/courses/super-admin-lesson-bulk-visibility.tsx:30-35`
- Fix: Show same switch and helper in create/edit; do not conflate content-only bulk.

## G2-2-018-005  [P2] GAP  facet F02  effort M
- Legacy: Lessons.js:473-505 bulk warning and selection actions above AntD table
- vNext now: super-admin-lesson-bulk-visibility.tsx:30-58 bulk in collapsed `<details>` before lesson articles
- Fix: Present selection toolbar in open list context rather than detached collapsed panel.

## G2-2-018-006  [P2] GAP  facet F03  effort S
- Legacy: Lessons.js:493-505 `N selected`, `Show to students`, `Hide from students`, `Clear selection`
- vNext now: super-admin-lesson-bulk-visibility.tsx:33,48-51 `N of M lessons selected`, `Show selected`, `Hide selected`; no clear-selection button
- Fix: Reinstate exact captions and explicit clear-selection action.

## G2-2-018-012  [P2] GAP  facet F04  effort M
- Legacy: Lessons.js:480-484 shows first five failed LESSON names and failure reasons
- vNext now: super-admin-lesson-bulk-visibility.tsx:53-55 repeats generic `Lesson update was not applied` per content
- Fix: Show each failed lesson name/id and sanitized specific reason, plus total omitted.

## G2-2-018-013  [P2] GAP  facet F05  effort M
- Legacy: Lessons.js:509-523 AntD selection retains keys across paging; page-size 10/25/50/100 persisted
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:118-123 fixed 25/page; super-admin-lesson-bulk-visibility.tsx:15-16 selection local to page
- Fix: Offer per-page size choices and preserved selection across pages or clearly disallow.

## G2-2-018-020  [P2] GAP  facet F06  effort M
- Legacy: Lessons.js:381-388 AntD confirmation requires action acknowledgement, shows five selected names
- vNext now: super-admin-lesson-bulk-visibility.tsx:17-20 browser confirm shows count only
- Fix: Use shared dialog with selected lesson preview, no-file-deletion explanation and danger visual.

## G2-2-018-029  [P2] GAP  facet F09  effort M
- Legacy: Lessons.js:381-388 Modal.confirm has title, explanatory no-file-deletion content, names, danger hide CTA
- vNext now: super-admin-lesson-bulk-visibility.tsx:19 browser confirm count only
- Fix: Replace confirm with accessible shared confirmation dialog.

## G2-2-018-030  [P2] GAP  facet F09  effort M
- Legacy: Lessons.js:473-492 closable partial failure alert with Retry failed action
- vNext now: super-admin-lesson-bulk-visibility.tsx:52-56 alert has no close/retry
- Fix: Add dismiss and retry on exact failed selection.

## G2-2-018-036  [P2] GAP  facet F10  effort M
- Legacy: Lessons.js:346-379 refreshes lesson list after partial and full operations; failures remain selected
- vNext now: super-admin-lesson-bulk-visibility.tsx:25-29 router.refresh keeps original selected array
- Fix: Clear success IDs and leave failed lesson IDs checked, then refresh current scoped list.

## G2-2-018-047  [P2] GAP  facet F13  effort S
- Legacy: Lessons.js:346-379 uses synchronous single-flight `bulkRef` and busy spinner
- vNext now: super-admin-lesson-bulk-visibility.tsx:15-29 pending state disabled but no immediate synchronous guard
- Fix: Use synchronous ref guard to block rapid double clicks before render.

## G2-2-018-052  [P2] GAP  facet F16  effort M
- Legacy: Lessons.js:410-433 `xs=24 lg=10/14` form/table; Table scroll x max-content line518
- vNext now: src/app/(authenticated)/admin/lessons/page.tsx:64-84 responsive form; super-admin-lesson-bulk-visibility.tsx:39-51 2-column list + stacked buttons
- Fix: Match large 10/14 split and phone horizontal-scrolling tabular selection.

## G2-2-018-054  [P2] GAP  facet F17  effort M
- Legacy: Lessons.js:381-388 AntD Modal.confirm focus/accessible button labels
- vNext now: super-admin-lesson-bulk-visibility.tsx:19 native confirm blocks with limited labelled dialog semantics
- Fix: Use shared ARIA dialog with focus trap, labelled selected names and return focus.

## G2-2-018-055  [P2] GAP  facet F17  effort M
- Legacy: Lessons.js:509-517 table rowSelection + keyboard-sortable controls; selection within data table
- vNext now: super-admin-lesson-bulk-visibility.tsx:35-47 label/Checkbox with select-all
- Fix: Preserve table checkbox row labels and keyboard selection while integrating bulk toolbar.

## G2-2-018-056  [P2] GAP  facet F18  effort S
- Legacy: Lessons.js:499-503 exact `Show to students`, `Hide from students`, `Clear selection`
- vNext now: super-admin-lesson-bulk-visibility.tsx:49-50 `Show selected`, `Hide selected`
- Fix: Restore exact visible command labels.

## G2-2-018-057  [P2] GAP  facet F18  effort M
- Legacy: Lessons.js:381-387 confirm `Selected lessons across the current list will be updated. No files are deleted by this action.`
- vNext now: super-admin-lesson-bulk-visibility.tsx:19 only numeric native confirm
- Fix: Add exact disclaimer and first five names.

## G2-2-018-058  [P2] GAP  facet F18  effort M
- Legacy: Lessons.js:473-489 partial heading `${label} was only partially completed`, button `Retry failed`
- vNext now: super-admin-lesson-bulk-visibility.tsx:53-55 numeric content summary, generic row error
- Fix: Restore copy, row failure reason, and retry button.

## G2-2-018-008  [P3] GAP  facet F03  effort S
- Legacy: Lessons.js:498-503 inline bulk action row appears only with a selection
- vNext now: super-admin-lesson-bulk-visibility.tsx:30-51 summary and buttons are shown for zero selection
- Fix: Hide or de-emphasize action bar until selection; match legacy conditional display.

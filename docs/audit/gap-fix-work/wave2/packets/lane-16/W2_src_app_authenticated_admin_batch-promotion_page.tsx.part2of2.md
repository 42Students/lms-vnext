# Work packet (wave 2): edit src/app/(authenticated)/admin/batch-promotion/page.tsx (part 2 of 2)

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-9-022-016  [P2] GAP  facet F04  effort S
- Legacy: Unknown status displays Unknown `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:317-322`
- vNext now: Enum status rendered verbatim in StatusBadge `src/app/(authenticated)/admin/batch-promotion/page.tsx:97-98`
- Fix: Restore Unknown when status missing

## G2-9-022-017  [P2] GAP  facet F05  effort S
- Legacy: Seven columns Batch Name, Program, Semester, Academic Year, Students, Status, Action `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:285-324`
- vNext now: Six columns; Batch combines program and name `src/app/(authenticated)/admin/batch-promotion/page.tsx:92-104`
- Fix: Restore separate Batch Name and Program columns

## G2-9-022-020  [P2] GAP  facet F05  effort S
- Legacy: Empty No active batches. Turn on Show completed / inactive... or No batches found `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:442-450`
- vNext now: Generic No matching batches state `src/app/(authenticated)/admin/batch-promotion/page.tsx:87-91`
- Fix: Restore contextual empty text and toggle recovery

## G2-9-022-021  [P2] GAP  facet F05  effort M
- Legacy: Promote opens a modal within current page, no navigation `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:165-189,354-364`
- vNext now: Preview link changes URL query and shows detail below `src/app/(authenticated)/admin/batch-promotion/page.tsx:98-110`
- Fix: Open a modal from row and keep list state

## G2-9-022-023  [P2] GAP  facet F06  effort S
- Legacy: Contextual suggested year and leave-blank guidance `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:503-506`
- vNext now: No suggested year/leave-blank helper in filter field `src/app/(authenticated)/admin/batch-promotion/page.tsx:71-74`
- Fix: Show legacy helper from preview state

## G2-9-022-038  [P2] GAP  facet F10  effort M
- Legacy: Preview endpoint called per selected batch and target term `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:191-205`
- vNext now: Server preview resolved from cohortId and yearStart in URL `src/modules/academics/college-batch-promotion-service.ts:76-113` `src/app/(authenticated)/admin/batch-promotion/page.tsx:37-50`
- Fix: Refresh preview after batch/year change and before action

## G2-9-022-049  [P2] GAP  facet F13  effort M
- Legacy: Separate Could not load batches/programs Retry alerts `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:435-441`
- vNext now: Server page loads together; no separate Retry programs/batches `src/app/(authenticated)/admin/batch-promotion/page.tsx:34-50`
- Fix: Provide granular load/retry banners

## G2-9-022-050  [P2] GAP  facet F13  effort S
- Legacy: Inline Ant spinner while batches fetched `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:442-449`
- vNext now: Server loading is page-level, not same table spinner `src/app/(authenticated)/admin/batch-promotion/page.tsx:35-51`
- Fix: Recreate in-card loading spinner

## G2-9-022-051  [P2] GAP  facet F13  effort M
- Legacy: Verifying with server and explicit error/success preview states `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:527-548`
- vNext now: Choose a batch empty state; other error may bubble `src/app/(authenticated)/admin/batch-promotion/page.tsx:108-110`
- Fix: Show safety review loading and failure states

## G2-9-022-054  [P2] GAP  facet F16  effort M
- Legacy: Ant Card/table x max-content, 200px selector, compact buttons `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:398-448`
- vNext now: Responsive grid and mobilePriority DataTable `src/app/(authenticated)/admin/batch-promotion/page.tsx:54-105`
- Fix: Use compact row density/toolbar, retain mobile tap targets

## G2-9-022-056  [P2] GAP  facet F18  effort S
- Legacy: Old subtitle Move a cohort to the next semester only after curriculum and staffing checks are ready `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:375-380`
- vNext now: New technical transactional description differs `src/app/(authenticated)/admin/batch-promotion/page.tsx:52-54`
- Fix: Use exact old subtitle

## G2-9-022-057  [P2] GAP  facet F18  effort S
- Legacy: Batch Name and inline Promote exact copy `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:285-289,354-364`
- vNext now: Combined Batch header and Preview arrow `src/app/(authenticated)/admin/batch-promotion/page.tsx:92-104`
- Fix: Restore labels and row button copy

## G2-9-022-061  [P2] GAP  facet F20  effort S
- Legacy: Consecutive YYYY-YY validation modulo century `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:16-20,507-513`
- vNext now: Parser accepts YYYY-YY but visible input is numeric start-year `src/modules/academics/college-batch-promotion-model.ts:5-17` `src/app/(authenticated)/admin/batch-promotion/page.tsx:71-74`
- Fix: Keep canonical formatted year input

## G2-9-022-066  [P2] GAP  facet F23  effort M
- Legacy: Legacy row action reflects active/final/inactive status `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:323-370`
- vNext now: New row always Preview link; action only after preview `src/app/(authenticated)/admin/batch-promotion/page.tsx:92-104`
- Fix: Show Promote/Graduate/Not active inline

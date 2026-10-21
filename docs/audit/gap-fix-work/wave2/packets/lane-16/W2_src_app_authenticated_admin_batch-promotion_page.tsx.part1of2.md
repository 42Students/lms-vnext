# Work packet (wave 2): edit src/app/(authenticated)/admin/batch-promotion/page.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-9-028-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy /superadmin/batch-promotion wrapper uses SuperAdminGroupShell academic `docs/legacy-source/frontend/src/pages/superadmin/batch-promotion.js:7-8,23-33`
- vNext now: New /admin/batch-promotion has independent header; linked via Academics More dropdown `src/app/(authenticated)/admin/batch-promotion/page.tsx:19-34` `src/app/(authenticated)/admin/academics/page.tsx:20-29`
- Fix: Restore visible academic group tabs/active tab

## G2-9-028-002  [P2] GAP  facet F01  effort S
- Legacy: Select a college to continue warning in plain ln-module `docs/legacy-source/frontend/src/pages/superadmin/batch-promotion.js:10-21`
- vNext now: Exact words shown in EmptyState after PageHeader `src/app/(authenticated)/admin/batch-promotion/page.tsx:30-34`
- Fix: Use legacy warning styling/location

## G2-9-028-004  [P2] GAP  facet F02  effort M
- Legacy: H1, subtitle, informational Alert, framed Batch Promotion Card `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:374-400`
- vNext now: PageHeader, filter form, Batches disclosure, preview sections and back link `src/app/(authenticated)/admin/batch-promotion/page.tsx:51-82`
- Fix: Restore single framed legacy list Card and initial banner order

## G2-9-028-005  [P2] GAP  facet F02  effort S
- Legacy: Subtitle Move a cohort to next semester only after curriculum/staffing ready; separate info Alert `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:375-396`
- vNext now: Long technical PageHeader description replaces both `src/app/(authenticated)/admin/batch-promotion/page.tsx:52-54`
- Fix: Use exact subtitle and info banner copy

## G2-9-028-006  [P2] GAP  facet F02  effort S
- Legacy: Table Card remains open across a selected batch `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:398-451`
- vNext now: Batches Disclosure closes by default when cohortId present `src/app/(authenticated)/admin/batch-promotion/page.tsx:81-87`
- Fix: Keep list visible after selection

## G2-9-028-007  [P2] MISSING  facet F03  effort S
- Legacy: Refresh button with Reload icon in Card extra `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:417-420`
- vNext now: Only Preview submit; no list-specific Refresh `src/app/(authenticated)/admin/batch-promotion/page.tsx:54-80`
- Fix: Add reload-icon Refresh next to program filter

## G2-9-028-008  [P2] GAP  facet F03  effort S
- Legacy: Program Select clearable with width 200px `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:401-413`
- vNext now: Full grid native Select All programs `src/app/(authenticated)/admin/batch-promotion/page.tsx:55-61`
- Fix: Match compact searchable clearable selector

## G2-9-028-009  [P2] GAP  facet F03  effort S
- Legacy: Small Switch Show completed / inactive plus hidden count `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:414-417`
- vNext now: Collapsed More filters Checkbox and no hidden count `src/app/(authenticated)/admin/batch-promotion/page.tsx:69-77`
- Fix: Use inline toggle with hidden count

## G2-9-028-010  [P2] GAP  facet F03  effort M
- Legacy: Inline small primary Promote with up-arrow icon `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:354-364`
- vNext now: Preview link and subsequent Promote Batch button `src/app/(authenticated)/admin/batch-promotion/page.tsx:98-104` `src/components/academics/college-promotion-confirmation.tsx:62-68`
- Fix: Restore row-level Promote button and icon

## G2-9-028-011  [P2] GAP  facet F03  effort M
- Legacy: Inline Mark graduated button with check-circle icon `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:334-347`
- vNext now: Graduate button appears only in preview, with no icon `src/app/(authenticated)/admin/batch-promotion/page.tsx:129-132` `src/components/admin/super-admin-batch-graduate-action.tsx:37-45`
- Fix: Render graduation inline with icon

## G2-9-028-012  [P2] GAP  facet F03  effort S
- Legacy: Status tags Active green, Inactive orange, Completed gray `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:7-12,316-321`
- vNext now: ACTIVE success and all other statuses neutral `src/app/(authenticated)/admin/batch-promotion/page.tsx:97-98`
- Fix: Use orange warning for INACTIVE, gray for COMPLETED

## G2-9-028-013  [P2] GAP  facet F04  effort S
- Legacy: Semester column blue Tag Semester N of MAX `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:297-308`
- vNext now: Plain numeric current term without max `src/app/(authenticated)/admin/batch-promotion/page.tsx:93-95`
- Fix: Show Semester N of MAX in blue chip

## G2-9-028-014  [P2] GAP  facet F04  effort S
- Legacy: Academic Year literal YYYY-YY or hyphen `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:310-315`
- vNext now: Expanded YYYY–YYYY or em dash `src/app/(authenticated)/admin/batch-promotion/page.tsx:95-96`
- Fix: Display YYYY-YY and legacy dash fallback

## G2-9-028-016  [P2] GAP  facet F04  effort S
- Legacy: Unknown status displays Unknown `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:317-322`
- vNext now: Enum status rendered verbatim in StatusBadge `src/app/(authenticated)/admin/batch-promotion/page.tsx:97-98`
- Fix: Restore Unknown when status missing

## G2-9-028-017  [P2] GAP  facet F05  effort S
- Legacy: Seven columns Batch Name, Program, Semester, Academic Year, Students, Status, Action `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:285-324`
- vNext now: Six columns; Batch combines program and name `src/app/(authenticated)/admin/batch-promotion/page.tsx:92-104`
- Fix: Restore separate Batch Name and Program columns

## G2-9-028-020  [P2] GAP  facet F05  effort S
- Legacy: Empty No active batches. Turn on Show completed / inactive... or No batches found `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:442-450`
- vNext now: Generic No matching batches state `src/app/(authenticated)/admin/batch-promotion/page.tsx:87-91`
- Fix: Restore contextual empty text and toggle recovery

## G2-9-028-021  [P2] GAP  facet F05  effort M
- Legacy: Promote opens a modal within current page, no navigation `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:165-189,354-364`
- vNext now: Preview link changes URL query and shows detail below `src/app/(authenticated)/admin/batch-promotion/page.tsx:98-110`
- Fix: Open a modal from row and keep list state

## G2-9-028-023  [P2] GAP  facet F06  effort S
- Legacy: Contextual suggested year and leave-blank guidance `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:503-506`
- vNext now: No suggested year/leave-blank helper in filter field `src/app/(authenticated)/admin/batch-promotion/page.tsx:71-74`
- Fix: Show legacy helper from preview state

## G2-9-028-038  [P2] GAP  facet F10  effort M
- Legacy: Preview endpoint called per selected batch and target term `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:191-205`
- vNext now: Server preview resolved from cohortId and yearStart in URL `src/modules/academics/college-batch-promotion-service.ts:76-113` `src/app/(authenticated)/admin/batch-promotion/page.tsx:37-50`
- Fix: Refresh preview after batch/year change and before action

## G2-9-028-049  [P2] GAP  facet F13  effort M
- Legacy: Separate Could not load batches/programs Retry alerts `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:435-441`
- vNext now: Server page loads together; no separate Retry programs/batches `src/app/(authenticated)/admin/batch-promotion/page.tsx:34-50`
- Fix: Provide granular load/retry banners

## G2-9-028-050  [P2] GAP  facet F13  effort S
- Legacy: Inline Ant spinner while batches fetched `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:442-449`
- vNext now: Server loading is page-level, not same table spinner `src/app/(authenticated)/admin/batch-promotion/page.tsx:35-51`
- Fix: Recreate in-card loading spinner

## G2-9-028-051  [P2] GAP  facet F13  effort M
- Legacy: Verifying with server and explicit error/success preview states `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:527-548`
- vNext now: Choose a batch empty state; other error may bubble `src/app/(authenticated)/admin/batch-promotion/page.tsx:108-110`
- Fix: Show safety review loading and failure states

## G2-9-028-054  [P2] GAP  facet F16  effort M
- Legacy: Ant Card/table x max-content, 200px selector, compact buttons `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:398-448`
- vNext now: Responsive grid and mobilePriority DataTable `src/app/(authenticated)/admin/batch-promotion/page.tsx:54-105`
- Fix: Use compact row density/toolbar, retain mobile tap targets

## G2-9-028-056  [P2] GAP  facet F18  effort S
- Legacy: Old subtitle Move a cohort to the next semester only after curriculum and staffing checks are ready `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:375-380`
- vNext now: New technical transactional description differs `src/app/(authenticated)/admin/batch-promotion/page.tsx:52-54`
- Fix: Use exact old subtitle

## G2-9-028-057  [P2] GAP  facet F18  effort S
- Legacy: Batch Name and inline Promote exact copy `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:285-289,354-364`
- vNext now: Combined Batch header and Preview arrow `src/app/(authenticated)/admin/batch-promotion/page.tsx:92-104`
- Fix: Restore labels and row button copy

## G2-9-028-061  [P2] GAP  facet F20  effort S
- Legacy: Consecutive YYYY-YY validation modulo century `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:16-20,507-513`
- vNext now: Parser accepts YYYY-YY but visible input is numeric start-year `src/modules/academics/college-batch-promotion-model.ts:5-17` `src/app/(authenticated)/admin/batch-promotion/page.tsx:71-74`
- Fix: Keep canonical formatted year input

## G2-9-028-066  [P2] GAP  facet F23  effort M
- Legacy: Legacy row action reflects active/final/inactive status `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:323-370`
- vNext now: New row always Preview link; action only after preview `src/app/(authenticated)/admin/batch-promotion/page.tsx:92-104`
- Fix: Show Promote/Graduate/Not active inline

## G2-9-022-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy /superadmin/batch-promotion wrapper uses SuperAdminGroupShell academic `docs/legacy-source/frontend/src/pages/superadmin/batch-promotion.js:7-8,23-33`
- vNext now: New /admin/batch-promotion has independent header; linked via Academics More dropdown `src/app/(authenticated)/admin/batch-promotion/page.tsx:19-34` `src/app/(authenticated)/admin/academics/page.tsx:20-29`
- Fix: Restore visible academic group tabs/active tab

## G2-9-022-002  [P2] GAP  facet F01  effort S
- Legacy: Select a college to continue warning in plain ln-module `docs/legacy-source/frontend/src/pages/superadmin/batch-promotion.js:10-21`
- vNext now: Exact words shown in EmptyState after PageHeader `src/app/(authenticated)/admin/batch-promotion/page.tsx:30-34`
- Fix: Use legacy warning styling/location

## G2-9-022-004  [P2] GAP  facet F02  effort M
- Legacy: H1, subtitle, informational Alert, framed Batch Promotion Card `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:374-400`
- vNext now: PageHeader, filter form, Batches disclosure, preview sections and back link `src/app/(authenticated)/admin/batch-promotion/page.tsx:51-82`
- Fix: Restore single framed legacy list Card and initial banner order

## G2-9-022-005  [P2] GAP  facet F02  effort S
- Legacy: Subtitle Move a cohort to next semester only after curriculum/staffing ready; separate info Alert `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:375-396`
- vNext now: Long technical PageHeader description replaces both `src/app/(authenticated)/admin/batch-promotion/page.tsx:52-54`
- Fix: Use exact subtitle and info banner copy

## G2-9-022-006  [P2] GAP  facet F02  effort S
- Legacy: Table Card remains open across a selected batch `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:398-451`
- vNext now: Batches Disclosure closes by default when cohortId present `src/app/(authenticated)/admin/batch-promotion/page.tsx:81-87`
- Fix: Keep list visible after selection

## G2-9-022-007  [P2] MISSING  facet F03  effort S
- Legacy: Refresh button with Reload icon in Card extra `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:417-420`
- vNext now: Only Preview submit; no list-specific Refresh `src/app/(authenticated)/admin/batch-promotion/page.tsx:54-80`
- Fix: Add reload-icon Refresh next to program filter

## G2-9-022-008  [P2] GAP  facet F03  effort S
- Legacy: Program Select clearable with width 200px `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:401-413`
- vNext now: Full grid native Select All programs `src/app/(authenticated)/admin/batch-promotion/page.tsx:55-61`
- Fix: Match compact searchable clearable selector

## G2-9-022-009  [P2] GAP  facet F03  effort S
- Legacy: Small Switch Show completed / inactive plus hidden count `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:414-417`
- vNext now: Collapsed More filters Checkbox and no hidden count `src/app/(authenticated)/admin/batch-promotion/page.tsx:69-77`
- Fix: Use inline toggle with hidden count

## G2-9-022-010  [P2] GAP  facet F03  effort M
- Legacy: Inline small primary Promote with up-arrow icon `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:354-364`
- vNext now: Preview link and subsequent Promote Batch button `src/app/(authenticated)/admin/batch-promotion/page.tsx:98-104` `src/components/academics/college-promotion-confirmation.tsx:62-68`
- Fix: Restore row-level Promote button and icon

## G2-9-022-011  [P2] GAP  facet F03  effort M
- Legacy: Inline Mark graduated button with check-circle icon `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:334-347`
- vNext now: Graduate button appears only in preview, with no icon `src/app/(authenticated)/admin/batch-promotion/page.tsx:129-132` `src/components/admin/super-admin-batch-graduate-action.tsx:37-45`
- Fix: Render graduation inline with icon

## G2-9-022-012  [P2] GAP  facet F03  effort S
- Legacy: Status tags Active green, Inactive orange, Completed gray `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:7-12,316-321`
- vNext now: ACTIVE success and all other statuses neutral `src/app/(authenticated)/admin/batch-promotion/page.tsx:97-98`
- Fix: Use orange warning for INACTIVE, gray for COMPLETED

## G2-9-022-013  [P2] GAP  facet F04  effort S
- Legacy: Semester column blue Tag Semester N of MAX `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:297-308`
- vNext now: Plain numeric current term without max `src/app/(authenticated)/admin/batch-promotion/page.tsx:93-95`
- Fix: Show Semester N of MAX in blue chip

## G2-9-022-014  [P2] GAP  facet F04  effort S
- Legacy: Academic Year literal YYYY-YY or hyphen `docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:310-315`
- vNext now: Expanded YYYY–YYYY or em dash `src/app/(authenticated)/admin/batch-promotion/page.tsx:95-96`
- Fix: Display YYYY-YY and legacy dash fallback

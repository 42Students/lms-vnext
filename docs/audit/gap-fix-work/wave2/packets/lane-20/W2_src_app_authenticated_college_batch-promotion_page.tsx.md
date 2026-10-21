# Work packet (wave 2): edit src/app/(authenticated)/college/batch-promotion/page.tsx

27 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/batch-controller.md, docs/audit/gap2/lane-9/college-admin-batch-promotion.md

## G2-2-029-005  [P2] GAP  facet F01  effort M
- Legacy: BatchController.java:159-227 POST promote and GET preview by batch ID.
- vNext now: src/app/api/academics/batch-promotion/execute/route.ts:9-26 and `college/batch-promotion/page.tsx:53-60` server preview.
- Fix: Map form preview/execute semantics and protect authorization on both routes.

## G2-2-029-024  [P2] GAP  facet F05  effort M
- Legacy: Batches.js:366-374 filters by program, status and substring search across name/year/status/semester.
- vNext now: college/batch-promotion/page.tsx:76-105 filters program,batch,yearStart, not a generic Batches text search.
- Fix: Match Batches admin searchable table filters in actual corresponding list page.

## G2-9-002-002  [P2] GAP  facet F01  effort M
- Legacy: AdminGroupShell groupKey academic wraps section (`docs/legacy-source/frontend/src/pages/college-admin/batch-promotion.js:30-38`)
- vNext now: Standalone PageHeader and BackLink to Batches (`src/app/(authenticated)/college/batch-promotion/page.tsx:71-81`)
- Fix: Restore Academic Setup group-level tab strip and active indication.

## G2-9-002-004  [P2] GAP  facet F02  effort M
- Legacy: Title, subtitle, info alert, Batch Promotion card/table (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:359-384`)
- vNext now: Title, filter form, single-batch preview (`src/app/(authenticated)/college/batch-promotion/page.tsx:72-115`)
- Fix: Put all-batches list before preview, preserve section order.

## G2-9-002-005  [P2] GAP  facet F02  effort M
- Legacy: Subtitle Move a cohort to the next semester only after curriculum and staffing checks are ready (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:362-376`)
- vNext now: Subtitle Server-verified eligibility preview... (`src/app/(authenticated)/college/batch-promotion/page.tsx:74-79`)
- Fix: Restore exact legacy subtitle.

## G2-9-002-007  [P2] GAP  facet F02  effort M
- Legacy: Promotion modal overlays the list (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:455-576`)
- vNext now: Preview renders inline and confirmation component separately (`src/app/(authenticated)/college/batch-promotion/page.tsx:112-180`)
- Fix: Use inline preview if desired, but preserve list-originated modal.

## G2-9-002-008  [P2] GAP  facet F03  effort M
- Legacy: Info banner about whole-batch curriculum/faculty requirements (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:372-384`)
- vNext now: Technical text about version and blockers in footer (`src/app/(authenticated)/college/batch-promotion/page.tsx:177-184`)
- Fix: Restore legacy slim informational banner copy above list.

## G2-9-002-009  [P2] GAP  facet F03  effort M
- Legacy: Filter by program select, show inactive switch, Refresh button (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:386-415`)
- vNext now: Program, Batch, Academic year override, Preview (`src/app/(authenticated)/college/batch-promotion/page.tsx:82-111`)
- Fix: Restore program filter, toggle, refresh control order.

## G2-9-002-011  [P2] GAP  facet F03  effort M
- Legacy: Unresolved program tooltip disables action (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:346-359`)
- vNext now: Blockers appear after explicit preview (`src/app/(authenticated)/college/batch-promotion/page.tsx:145-160`)
- Fix: Show disabled explanation on row hover/focus.

## G2-9-002-014  [P2] GAP  facet F04  effort M
- Legacy: Program falls back to lookup or hyphen (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:288-307`)
- vNext now: Single program name from preview (`src/app/(authenticated)/college/batch-promotion/page.tsx:115-134`)
- Fix: Render table program name with '-' fallback.

## G2-9-002-015  [P2] GAP  facet F04  effort M
- Legacy: Semester N of max pill (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:299-306`)
- vNext now: Recorded term and target term paragraph (`src/app/(authenticated)/college/batch-promotion/page.tsx:132-140`)
- Fix: Show 'Semester' pill and of-max context.

## G2-9-002-016  [P2] GAP  facet F04  effort M
- Legacy: Academic Year string or '-' (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:302-312`)
- vNext now: Current year integer or Not recorded (`src/app/(authenticated)/college/batch-promotion/page.tsx:132-145`)
- Fix: Format year YYYY-YY in rows and preserve empty hyphen.

## G2-9-002-017  [P2] GAP  facet F04  effort M
- Legacy: Students numeric server currentStudents count (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:303-313`)
- vNext now: Learner preview count capped at 2000 (`src/app/(authenticated)/college/batch-promotion/page.tsx:141-152`)
- Fix: Read independently persisted current student count for list; do not infer.

## G2-9-002-018  [P2] GAP  facet F04  effort M
- Legacy: Active green, Inactive orange, Completed neutral, Unknown (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:10-18`)
- vNext now: Raw batch.status text in detail (`src/app/(authenticated)/college/batch-promotion/page.tsx:119-140`)
- Fix: Restore correctly toned status tags.

## G2-9-002-022  [P2] GAP  facet F05  effort M
- Legacy: horizontal x:max-content scroll (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:440-451`)
- vNext now: Separate learner table (`src/app/(authenticated)/college/batch-promotion/page.tsx:171-181`)
- Fix: Preserve horizontal overflow handling for seven columns.

## G2-9-002-024  [P2] GAP  facet F06  effort M
- Legacy: Filter by program placeholder, allowClear, width 200 (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:387-400`)
- vNext now: All programs option (`src/app/(authenticated)/college/batch-promotion/page.tsx:84-92`)
- Fix: Use exact placeholder and clearable state.

## G2-9-002-025  [P2] MISSING  facet F06  effort M
- Legacy: Small Show completed/inactive Switch off by default (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:399-407`)
- vNext now: Batch selector includes inactive, no switch (`src/app/(authenticated)/college/batch-promotion/page.tsx:88-101`)
- Fix: Add switch, default false, count hidden.

## G2-9-002-026  [P2] GAP  facet F06  effort M
- Legacy: Optional new_academic_year override inside modal (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:516-528`)
- vNext now: Optional yearStart outside modal on main GET form (`src/app/(authenticated)/college/batch-promotion/page.tsx:97-105`)
- Fix: Place override with review dialog or preserve submitted value in dialog.

## G2-9-002-028  [P2] GAP  facet F06  effort M
- Legacy: Suggested year placeholder and Leave blank... helper (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:515-525`)
- vNext now: fixed e.g., 2099-00 placeholder, no suggested-year help (`src/app/(authenticated)/college/batch-promotion/page.tsx:96-105`)
- Fix: Use fresh-preview suggested-year or current-year helper.

## G2-9-002-057  [P2] GAP  facet F13  effort M
- Legacy: Separate batch and program loads/errors (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:47-102`)
- vNext now: Single SSR read with common error response (`src/app/(authenticated)/college/batch-promotion/page.tsx:45-74`)
- Fix: Separate list loading/error/retry by data source.

## G2-9-002-058  [P2] GAP  facet F13  effort M
- Legacy: No active batches. Turn on Show completed... vs No batches found (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:442-455`)
- vNext now: No promotion preview until a batch selected (`src/app/(authenticated)/college/batch-promotion/page.tsx:111-115`)
- Fix: Restore list empty state separately.

## G2-9-002-059  [P2] GAP  facet F13  effort M
- Legacy: Verifying server/ready/not ready/staffing warning modal states (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:535-571`)
- vNext now: Inline blocker or faculty setup message (`src/app/(authenticated)/college/batch-promotion/page.tsx:144-160`)
- Fix: Preserve each distinct state and wording.

## G2-9-002-064  [P2] GAP  facet F16  effort M
- Legacy: Table scroll x:max-content for narrow viewport (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:441-455`)
- vNext now: Filter form wraps md 2/lg 4 columns; no batch table (`src/app/(authenticated)/college/batch-promotion/page.tsx:80-109`)
- Fix: Add horizontally scrollable batch table with mobile scroll cue.

## G2-9-002-066  [P2] MISSING  facet F17  effort M
- Legacy: Switch aria-label Show completed and inactive batches (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:396-405`)
- vNext now: No corresponding switch (`src/app/(authenticated)/college/batch-promotion/page.tsx:84-109`)
- Fix: Restore labelled keyboard-operable switch.

## G2-9-002-067  [P2] GAP  facet F17  effort M
- Legacy: Tooltip on disabled button for unresolved program (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:343-361`)
- vNext now: Batch blockers only after preview (`src/app/(authenticated)/college/batch-promotion/page.tsx:135-158`)
- Fix: Expose disabled reason to keyboard and screen reader on row.

## G2-9-002-069  [P2] GAP  facet F18  effort M
- Legacy: Semester N of M, Graduated, Status unavailable (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:295-307`)
- vNext now: Term wording, raw status (`src/app/(authenticated)/college/batch-promotion/page.tsx:130-140`)
- Fix: Use legacy Semester/Completed labels and fallback text.

## G2-9-002-071  [P2] MISSING  facet F18  effort M
- Legacy: Show completed / inactive (N) label (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:401-410`)
- vNext now: No toggle copy (`src/app/(authenticated)/college/batch-promotion/page.tsx:86-97`)
- Fix: Restore exact phrase and count.

# Work packet: edit src/app/(authenticated)/college/batch-promotion/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-batch-promotion.md

## G2-9-002-003  [P1] GAP  facet F01  effort M
- Legacy: Absent college shows warning in place (`docs/legacy-source/frontend/src/pages/college-admin/batch-promotion.js:21-31`)
- vNext now: Absent context membership redirects to dashboard (`src/app/(authenticated)/college/batch-promotion/page.tsx:36-40`)
- Fix: Show exact warning instead of uninformative redirect.

## G2-9-002-006  [P1] MISSING  facet F02  effort M
- Legacy: Card with program filter, switch, refresh and 7-column directory (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:387-453`)
- vNext now: Three-field GET filter form and Preview (`src/app/(authenticated)/college/batch-promotion/page.tsx:82-112`)
- Fix: Recreate table directory as main page content.

## G2-9-002-012  [P1] MISSING  facet F03  effort M
- Legacy: Mark graduated visible at max semester (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:316-335`)
- vNext now: Graduation mentioned only in footer (`src/app/(authenticated)/college/batch-promotion/page.tsx:177-184`)
- Fix: Expose actionable graduation button.

## G2-9-002-013  [P1] GAP  facet F04  effort M
- Legacy: Batch Name, Program, Semester, Academic Year, Students, Status, Action (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:283-321`)
- vNext now: Selected batch details and learner blockers table (`src/app/(authenticated)/college/batch-promotion/page.tsx:112-176`)
- Fix: Restore all seven columns in all-batch list.

## G2-9-002-020  [P1] MISSING  facet F05  effort M
- Legacy: Ant Table 10 rows per page with size changer and total range (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:440-451`)
- vNext now: Learner blocker DataTable without batch pagination (`src/app/(authenticated)/college/batch-promotion/page.tsx:169-180`)
- Fix: Restore 10-row batch pagination, size selector, range summary.

## G2-9-002-021  [P1] MISSING  facet F05  effort M
- Legacy: Last Action column has Promote, Mark graduated or disabled-state text (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:286-363`)
- vNext now: No per-batch action before preview (`src/app/(authenticated)/college/batch-promotion/page.tsx:112-176`)
- Fix: Add row action column and status rules.

## G2-9-002-036  [P1] MISSING  facet F08  effort M
- Legacy: Graduation success Marked <batch> as graduated (Completed). (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:142-168`)
- vNext now: No graduation feedback action (`src/app/(authenticated)/college/batch-promotion/page.tsx:175-184`)
- Fix: Restore graduation toast when mutation succeeds.

## G2-9-002-041  [P1] MISSING  facet F09  effort M
- Legacy: Graduation Popconfirm Graduate <batch>? with explanation and Mark graduated (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:316-342`)
- vNext now: No trigger (`src/app/(authenticated)/college/batch-promotion/page.tsx:175-184`)
- Fix: Restore graduation Popconfirm with reactivation note.

## G2-9-002-048  [P1] GAP  facet F11  effort M
- Legacy: No college alert, not redirect (`docs/legacy-source/frontend/src/pages/college-admin/batch-promotion.js:20-31`)
- vNext now: No membership redirects /dashboard (`src/app/(authenticated)/college/batch-promotion/page.tsx:36-40`)
- Fix: Show Admin not assigned to a college warning and Contact administrator.

## G2-9-002-087  [P1] MISSING  facet F23  effort M
- Legacy: Graduate action available on final-term row (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:312-344`)
- vNext now: Only textual graduation note (`src/app/(authenticated)/college/batch-promotion/page.tsx:174-184`)
- Fix: Restore one-click guarded graduation and status toggle/list.

## G2-9-002-032  [P2] GAP  facet F07  effort M
- Legacy: Preview failures set valid:false Could not verify this promotion. Please retry. (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:203-222`)
- vNext now: Global Batch promotion preview unavailable (`src/app/(authenticated)/college/batch-promotion/page.tsx:58-73`)
- Fix: Separate server verification failure from missing resource/invalid URL.

## G2-9-002-034  [P2] GAP  facet F07  effort M
- Legacy: Separate Could not load batches and Could not load programs alerts (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:430-442`)
- vNext now: Single preview unavailable ErrorState (`src/app/(authenticated)/college/batch-promotion/page.tsx:58-74`)
- Fix: Add independent load-error banners and Retry.

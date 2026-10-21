# Work packet (wave 2): edit src/app/(authenticated)/college/activity/page.tsx

23 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-audit.md

## G2-9-001-005  [P2] GAP  facet F02  effort M
- Legacy: PageShell heading then ActivityCenter (`docs/legacy-source/frontend/src/pages/college-admin/audit.js:29-43`)
- vNext now: PageHeader adds extra subtitle; Tabs and date shortcut strip (`src/app/(authenticated)/college/activity/page.tsx:45-81`)
- Fix: Mirror legacy header section order.

## G2-9-001-006  [P2] GAP  facet F02  effort M
- Legacy: Category/date segmented controls, Refresh, Export in one toolbar (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:207-228`)
- vNext now: Category Tabs then separate date links (`src/app/(authenticated)/college/activity/page.tsx:53-80`)
- Fix: Recreate single toolbar with segmented controls and icons.

## G2-9-001-008  [P2] GAP  facet F03  effort M
- Legacy: Important, Academic setup, People & access, Teaching, Projects, Everything segmented labels (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:25-41`)
- vNext now: Same labels as underline tabs (`src/app/(authenticated)/college/activity/page.tsx:53-65`)
- Fix: Match segmented layout and selected visual state.

## G2-9-001-009  [P2] GAP  facet F03  effort M
- Legacy: Refresh and Export small icon buttons (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:209-221`)
- vNext now: Text links; Export is header action (`src/app/(authenticated)/college/activity/page.tsx:48-52,77-79`)
- Fix: Place icon buttons in toolbar with loading and disabled states.

## G2-9-001-010  [P2] GAP  facet F03  effort M
- Legacy: Important help sentence about deletions/restores/suspensions/identity (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:217-230`)
- vNext now: Generic importance explanation below table (`src/app/(authenticated)/college/activity/page.tsx:198-204`)
- Fix: Restore full legacy hint next to category control.

## G2-9-001-011  [P2] GAP  facet F03  effort M
- Legacy: Colored severity-toned list item (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:237-254`)
- vNext now: Plain table row without tone (`src/app/(authenticated)/college/activity/page.tsx:173-187`)
- Fix: Apply danger/warn/good/neutral accent.

## G2-9-001-012  [P2] MISSING  facet F03  effort M
- Legacy: Bulk actions tagged several at once (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:241-248`)
- vNext now: Summary and action text without bulk tag (`src/app/(authenticated)/college/activity/page.tsx:177-181`)
- Fix: Show bulk tag based on action taxonomy.

## G2-9-001-013  [P2] GAP  facet F03  effort M
- Legacy: Per-row Details/Hide details button (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:245-253`)
- vNext now: View event deep-link (`src/app/(authenticated)/college/activity/page.tsx:182-190`)
- Fix: Restore inline details button; keep deep-link secondary.

## G2-9-001-014  [P2] GAP  facet F04  effort M
- Legacy: Today, Yesterday or weekday D MMM YYYY day headings (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:47-55`)
- vNext now: Single en-IN medium date/time per table row (`src/app/(authenticated)/college/activity/page.tsx:19-23,175-180`)
- Fix: Restore day heading and h:mm A per item.

## G2-9-001-019  [P2] GAP  facet F05  effort M
- Legacy: PAGE_SIZE=50 (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:24`)
- vNext now: Default events per page=25, optional 10/25/50 (`src/app/(authenticated)/college/activity/page.tsx:152-158`)
- Fix: Default to 50.

## G2-9-001-020  [P2] GAP  facet F05  effort M
- Legacy: Load more appends and shows count of older events (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:249-259`)
- vNext now: Older activity navigates cursor, no remaining count (`src/app/(authenticated)/college/activity/page.tsx:192-196`)
- Fix: Append to current feed with legacy count text.

## G2-9-001-025  [P2] GAP  facet F06  effort M
- Legacy: Today, 7 days, 30 days, All time labels (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:35-41`)
- vNext now: Today, Last 7 days, Last 30 days, All time links (`src/app/(authenticated)/college/activity/page.tsx:67-79`)
- Fix: Match exact legacy labels and segmented control.

## G2-9-001-041  [P2] GAP  facet F11  effort M
- Legacy: No-college Warning Alert contact administrator (`docs/legacy-source/frontend/src/pages/college-admin/audit.js:17-29`)
- vNext now: No-membership ErrorState with different copy (`src/app/(authenticated)/college/activity/page.tsx:28-29`)
- Fix: Match legacy warning and wording.

## G2-9-001-046  [P2] GAP  facet F13  effort M
- Legacy: Six-row skeleton when filters change (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:223-235`)
- vNext now: Page awaits server result; no local skeleton in this file (`src/app/(authenticated)/college/activity/page.tsx:25-45`)
- Fix: Add equivalent route/Suspense skeleton and verify shell.

## G2-9-001-047  [P2] GAP  facet F13  effort M
- Legacy: Important empty: Nothing important happened in this period; other: No activity in this period (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:230-239`)
- vNext now: No matching activity for all categories (`src/app/(authenticated)/college/activity/page.tsx:185-190`)
- Fix: Restore category-specific empty copy.

## G2-9-001-048  [P2] GAP  facet F13  effort M
- Legacy: Retry button on failed network request (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:137-158`)
- vNext now: Clear filters on invalid query only (`src/app/(authenticated)/college/activity/page.tsx:33-38`)
- Fix: Add inline reload/error retry.

## G2-9-001-056  [P2] GAP  facet F16  effort M
- Legacy: Ant Space wrap and segmented controls (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:207-230`)
- vNext now: Responsive md two columns, lg four columns (`src/app/(authenticated)/college/activity/page.tsx:80-170`)
- Fix: Visual-compare at 375/768/1280; restore compact toolbar geometry.

## G2-9-001-057  [P2] GAP  facet F16  effort M
- Legacy: Desktop feed with left timestamp gutter (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:207-259`)
- vNext now: Responsive table columns/mobile priorities (`src/app/(authenticated)/college/activity/page.tsx:172-190`)
- Fix: Keep readable mobile day list without horizontal overflow.

## G2-9-001-058  [P2] GAP  facet F17  effort M
- Legacy: Native Details toggle button keyboard accessible (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:243-250`)
- vNext now: Focusable View event anchor (`src/app/(authenticated)/college/activity/page.tsx:182-190`)
- Fix: Implement aria-expanded/controls and focus return for inline detail.

## G2-9-001-059  [P2] GAP  facet F17  effort M
- Legacy: Day headings convey group boundary (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:232-257`)
- vNext now: DataTable caption College activity events (`src/app/(authenticated)/college/activity/page.tsx:172-174`)
- Fix: Semantic h3 per-day grouping plus accessible list structure.

## G2-9-001-060  [P2] GAP  facet F18  effort M
- Legacy: Exact labels Today/7 days/30 days/All time (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:26-40`)
- vNext now: Uses Last 7 days/Last 30 days (`src/app/(authenticated)/college/activity/page.tsx:69-76`)
- Fix: Replace date label strings.

## G2-9-001-061  [P2] GAP  facet F18  effort M
- Legacy: Exact error/empty/details copy (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:224-245`)
- vNext now: No matching activity, View event (`src/app/(authenticated)/college/activity/page.tsx:185-190`)
- Fix: Port exact category-specific empty and Details/Hide details.

## G2-9-001-064  [P2] GAP  facet F19  effort M
- Legacy: Legacy server reports total for remaining count (`docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:103-131`)
- vNext now: Only has next cursor (`src/app/(authenticated)/college/activity/page.tsx:191-196`)
- Fix: Add remaining count or explicitly approve keyset behavior.

# Work packet: edit src/components/placements/super-admin-bulk-drive-actions.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-all.md, docs/audit/gap2/lane-8/super-admin-jobs-directory.md

## G2-10-016-028  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:334-362 — Toggle job status directly from table and toast success.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:22-45 — Bulk action via collapsed panel; individual action on job settings missing.
- Fix: Reintroduce single Close/Open status action with guard.

## G2-10-016-029  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-475 — Delete preview counts active apps/learners/open interviews, Popconfirm and retry.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:22-45 — No per-row delete in full table; only job workspace archive action.
- Fix: Bring scoped impact-preview Delete action to row if policy allows.

## G2-10-016-052  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-475 — Legacy delete preview retains apps and informs recipients, lists open interview cancellation.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:81-100 — Modern archive generally blocks accepted offers, withdraws offers and notifies.
- Fix: Review behavioral differences and show exact truthful impact.

## G2-10-016-059  [P1] GAP  facet F15  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:723-751 — Bulk Close warns learners will no longer be able to apply.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:90-99 — New preview says issued offers may be withdrawn; no email copy there.
- Fix: Present all immediate user consequences.

## G2-10-016-060  [P1] GAP  facet F15  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-457 — Deletion preview promises affected learners notified and interviews cancelled.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:93-101 — Modern archive likewise notifies/cancels with additional offer consequences.
- Fix: Check actual email/in-app recipients/template and describe added offer effects.

## G2-10-016-077  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:334-395 — Per-job mutation guard plus bulk lock prevents duplicate writes.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:21-45 — New bulk guarded inFlightRef; row mutation absent.
- Fix: Preserve per-entity concurrency protection.

## G2-10-016-082  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-475 — Legacy deletion uses numeric job record ID with impact and service side effects.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:90-124 — Modern archive via job UUID, preview/update token and offer cancellations.
- Fix: Document model and side-effect migration.

## G2-8-030-006  [P1] GAP  facet F03  effort M
- Legacy: Old Create Job, View Applications, Edit, Open/Close, Delete per row docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:566-610,719-721.
- vNext now: New Create drive, Open drive, bulk Open/Close but lacks Edit/Delete row buttons on index src/app/(authenticated)/admin/placements/drives/page.tsx:71-84; src/components/placements/super-admin-bulk-drive-actions.tsx:51-77.
- Fix: Restore direct edit/delete and view applications row actions.

## G2-8-030-031  [P1] GAP  facet F09  effort M
- Legacy: Old Delete impact Modal shows job title, counts and learner notice warning docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-460.
- vNext now: New bulk Close ConfirmDialog warns issued offers may be withdrawn, no Delete modal src/components/placements/super-admin-bulk-drive-actions.tsx:116-125.
- Fix: Preserve separate delete impact and confirmation, never equate close with delete.

## G2-8-030-041  [P1] GAP  facet F12  effort M
- Legacy: Old delete preflight warns active applications and interviews, preserves app records and sends notice docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-450.
- vNext now: New CLOSE path may withdraw issued offers, historical decisions kept src/modules/placements/super-admin-bulk-drive-service.ts:86-109; src/components/placements/super-admin-bulk-drive-actions.tsx:88-90.
- Fix: Distinguish destructive delete from close/offer withdrawal, verify data handling.

## G2-8-030-046  [P1] GAP  facet F15  effort M
- Legacy: Old delete warning learners notified, bulk close disables applying docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:441-447,739-742.
- vNext now: New bulk CLOSE warns issued offers withdrawn; events via closePlacementJob src/components/placements/super-admin-bulk-drive-actions.tsx:88-97; src/modules/placements/super-admin-bulk-drive-service.ts:100-102.
- Fix: Preserve learner notification semantics for close/delete and make affected count visible.

## G2-10-016-032  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:334-362 — Status mutation rejects duplicate in-flight request using keyed locks.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:24-45 — Bulk uses inFlightRef, no single row action.
- Fix: Retain per-job locks for repeated toggles.

## G2-10-016-033  [P2] MISSING  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-475 — Deletion preview error 'Could not preview deletion impact. Nothing was deleted.'.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:22-45 — Bulk module has unrelated failure message; no delete error in list.
- Fix: Restore actionable preview failure copy on row.

## G2-10-016-035  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:346-354 — Toast 'Job opened/closed successfully', error Alert with Retry.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:105-117 — Bulk outcome lists N updated/skipped, no individual status toast.
- Fix: Restore consistent toggle feedback.

## G2-8-030-027  [P2] GAP  facet F08  effort M
- Legacy: Old per-job toggled toast Job opened successfully or Job closed successfully docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:334-349.
- vNext now: New bulk displays N updated,N failed inline; no per-job toast src/components/placements/super-admin-bulk-drive-actions.tsx:106-113.
- Fix: Use action-specific toast on single Open/Close.

## G2-10-016-036  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:384-390 — Bulk success N drive(s) opened/closed; partial warning with failed count.
- vNext now: src/components/placements/super-admin-bulk-drive-actions.tsx:105-117 — Modern result N updated/N failed, retry only failed.
- Fix: Match explicit verb/state labels.

## G2-8-030-029  [P3] GAP  facet F08  effort M
- Legacy: Old bulk success N drive(s) opened/closed via message.success docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:380-387.
- vNext now: New inline result Updated/failed with no transient toast src/components/placements/super-admin-bulk-drive-actions.tsx:106-113.
- Fix: Match notification position/lifetime and exact wording.

# Work packet: edit src/app/(authenticated)/college/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-dashboard.md, docs/audit/gap2/lane-9/college-admin-index.md

## G2-9-005-026  [P1] GAP  facet F07  effort M
- Legacy: Missing college warning Some features are limited. Contact your administrator (`docs/legacy-source/frontend/src/pages/college-admin/dashboard.js:53-63`)
- vNext now: Full EmptyState with no dashboard sections (`src/app/(authenticated)/college/page.tsx:25-38`)
- Fix: Allow legacy warning+Quick Actions while blocking scoped data.

## G2-9-005-040  [P1] GAP  facet F11  effort M
- Legacy: No college shows warning and Quick Actions still render (`docs/legacy-source/frontend/src/pages/college-admin/dashboard.js:53-63`)
- vNext now: No membership returns early EmptyState (`src/app/(authenticated)/college/page.tsx:23-38`)
- Fix: Keep accessible non-scoped navigation or document owner security decision.

## G2-9-009-001  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — Root /college-admin returns HTTP 302 to /college-admin/dashboard
- vNext now: `src/app/(authenticated)/college/page.tsx:23-30` — /college renders overview, not redirect
- Fix: Create canonical root alias redirect to the corresponding college dashboard or explicitly document route remapping

## G2-9-009-014  [P1] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — getServerSideProps writes 302 and Location, calls response.end()
- vNext now: `src/app/(authenticated)/college/page.tsx:23-45` — Async server component queries context and colleges; no redirect
- Fix: Implement HTTP redirect via Next redirect API on alias route

## G2-9-005-027  [P2] GAP  facet F07  effort M
- Legacy: Summary refresh failure warns and retains previous successful totals (`docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:63-71`)
- vNext now: Promise.allSettled error render per section but no retained stale totals (`src/app/(authenticated)/college/page.tsx:45-71`)
- Fix: Add non-destructive retry for same-college summaries.

## G2-9-005-029  [P2] GAP  facet F07  effort M
- Legacy: Each failed attention card says Couldn't load this. Refresh to try again. (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:27-56`)
- vNext now: Failure message through fallback sections (`src/app/(authenticated)/college/page.tsx:156-290`)
- Fix: Map per-category failure to exact legacy wording.

## G2-9-005-030  [P2] GAP  facet F08  effort M
- Legacy: Refresh text button and Reload icon for Today board (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:140-150`)
- vNext now: SSR service no explicit Refresh control in page (`src/app/(authenticated)/college/page.tsx:141-152`)
- Fix: Add Today Refresh affordance and busy state.

## G2-9-005-032  [P2] GAP  facet F08  effort M
- Legacy: All clear banner Nothing needs you right now. (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:116-132`)
- vNext now: No exact single all-clear banner in dashboard page (`src/app/(authenticated)/college/page.tsx:155-295`)
- Fix: Restore all-clear summary when all relevant counts zero.

## G2-9-009-011  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — No client validation; unconditional 302
- vNext now: `src/app/(authenticated)/college/page.tsx:27-45` — Membership and college validity determine different EmptyStates
- Fix: Preserve a single unconditional alias response; guard destination instead

## G2-9-009-012  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — No toast or success/info copy, only redirect
- vNext now: `src/app/(authenticated)/college/page.tsx:27-45` — Visible no-college EmptyState can appear at root
- Fix: Retain silent redirect and put explanatory empty text only at destination

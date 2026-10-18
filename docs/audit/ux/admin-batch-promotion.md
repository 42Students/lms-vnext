# UX — /admin/batch-promotion

- **Before:** Some internal links used shorter-than-44px targets and decorative teal for normal-size links.
- **After:** Preserved existing PageHeader, role/scope checks, data/loading/empty branches and component-driven interactions. Raised small targets to 44px, used deep-teal accessible links and ensured 320px containment.
- **States:** Existing blocked/denied and mutation feedback unchanged; the page continues to distinguish scope absence from empty records.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-batch-promotion-01`. Source-reviewed, browser/AT/test execution pending.

## Follow-up responsive queue closure
- Replaced the fixed `min-w-[44rem]` Batch Promotion table with shared `DataTable`; preserved the exact Batch/Semester/Academic Year/Students/Status/Action labels and Preview query parameters. The legacy empty message is passed as required `empty`; row actions stay visible at 320px.
- See `UX-admin-batch-promotion-02`.

## Bounded loading and retry
- Replaced the indefinite loading pulse with the shared `GracefulPageLoading`, preserving “Loading batch promotion preview”. It provides a semantic reduced-motion skeleton and a recovery control after a slow network response. Tests: `UX-admin-batch-promotion-03`.

## Cross-audit chat-12 — A12-093 (MAJOR)

The previous rollout retained native page-local text/search/date/number/select or submit controls. At 320/360/390px these lack a consistently guaranteed 16px input font, accessible 44px focus target and audited shared focus styling. Reused the existing shared `Input` (1), `Select` (2), `Button` (1). Kept every original label, filter key/default, GET request, hidden scope control and business action. Announcement primary action no longer requests `text-primary-foreground` against the bright brand fill. Targeted source contract: `tests/unit/UX-admin-batch-promotion-12-01.test.ts`. Real viewport, TypeScript, Vitest and native WebView checks remain orchestrator work; no runtime pass is claimed.

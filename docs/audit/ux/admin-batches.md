# UX — /admin/batches

- **Before:** Dense wide roster forced sideways scrolling on phones; filter fields had hard minimum widths; links could be 40px tall or low-contrast.
- **After:** Existing Manage batches rows now use the shared responsive `DataTable`, with an explicitly worded empty state, a primary name, visible row actions, and other fields under accessible “More details” on narrow screens. The original column labels, filter names, links and per-row mutation actions remain intact. `PageHeader` provides one route-level title; filters can stack at 320px. Interactive links meet 44px height and deep-teal link contrast.
- **States:** No selected college still uses the existing status message; empty/filtered list uses `DataTable.empty`; pagination and applied URL filters are retained; mutation pending/error stays in existing action components.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-batches-01`. Source-reviewed only; CI/browser/AT evidence pending.

## Bounded loading and retry
- Upgraded the indefinite skeleton to `GracefulPageLoading` while retaining “Loading batches”. A reduced-motion loading shape and 12-second recovery control are provided; source test `UX-admin-batches-03`.

## Cross-audit chat-12 — A12-051 (MAJOR)

The previous rollout retained native page-local text/search/date/number/select or submit controls. At 320/360/390px these lack a consistently guaranteed 16px input font, accessible 44px focus target and audited shared focus styling. Reused the existing shared `Input` (1), `Select` (3), `Button` (2). Kept every original label, filter key/default, GET request, hidden scope control and business action. Announcement primary action no longer requests `text-primary-foreground` against the bright brand fill. Targeted source contract: `tests/unit/UX-admin-batches-12-01.test.ts`. Real viewport, TypeScript, Vitest and native WebView checks remain orchestrator work; no runtime pass is claimed.

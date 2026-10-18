# UX — /admin/colleges

- **Before / review:** Audited this exact route against the signed-off playbook for 320px containment, focus/touch sizing, contrast, loading/empty/error and role-scoped actions. Existing services and legacy copy remain the authority.
- **Change:** Normalized 0 small touch targets to 44px, 0 teal text uses to accessible deep teal, and safe `min-w-0` containment / shell landmark handling as applicable. Did not replace permission checks, filters, submission logic or existing error/empty copy.
- **States:** Original no-scope, denied, loading, existing list/form actions and service errors are unchanged. Browser/WebView and screen-reader checks pending orchestrator run.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-colleges-01`.

## Follow-up responsive directory closure
- Removed duplicate phone cards and desktop-only table: the shared `DataTable` now renders one row DOM and keeps Tenant setup, Readiness, Branding, Edit and Archive actions on phone. Added explicit `mobilePriority` and the shared `Pagination` with preserved search/page-size URL state.
- Search label and all legacy buttons/messages remain unchanged. See `UX-admin-colleges-02`.

## Single truthful empty state
- Removed the redundant scope-empty panel that appeared above the responsive `DataTable.empty` rendering. The existing college-empty wording now appears only once, including on 320px screens. Test `UX-admin-colleges-04`.

## Cross-audit chat-12 — A12-124 (MAJOR)

The previous rollout retained native page-local text/search/date/number/select or submit controls. At 320/360/390px these lack a consistently guaranteed 16px input font, accessible 44px focus target and audited shared focus styling. Reused the existing shared `Input` (1), `Select` (1), `Button` (1). Kept every original label, filter key/default, GET request, hidden scope control and business action. Announcement primary action no longer requests `text-primary-foreground` against the bright brand fill. Targeted source contract: `tests/unit/UX-admin-colleges-12-01.test.ts`. Real viewport, TypeScript, Vitest and native WebView checks remain orchestrator work; no runtime pass is claimed.

# UX — /admin/colleges

- **Before / review:** Audited this exact route against the signed-off playbook for 320px containment, focus/touch sizing, contrast, loading/empty/error and role-scoped actions. Existing services and legacy copy remain the authority.
- **Change:** Normalized 0 small touch targets to 44px, 0 teal text uses to accessible deep teal, and safe `min-w-0` containment / shell landmark handling as applicable. Did not replace permission checks, filters, submission logic or existing error/empty copy.
- **States:** Original no-scope, denied, loading, existing list/form actions and service errors are unchanged. Browser/WebView and screen-reader checks pending orchestrator run.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-colleges-01`.

## Follow-up responsive directory closure
- Removed duplicate phone cards and desktop-only table: the shared `DataTable` now renders one row DOM and keeps Tenant setup, Readiness, Branding, Edit and Archive actions on phone. Added explicit `mobilePriority` and the shared `Pagination` with preserved search/page-size URL state.
- Search label and all legacy buttons/messages remain unchanged. See `UX-admin-colleges-02`.

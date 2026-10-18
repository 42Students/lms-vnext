# UX — /admin/colleges/[collegeId]

- **Before / review:** Audited this exact route against the signed-off playbook for 320px containment, focus/touch sizing, contrast, loading/empty/error and role-scoped actions. Existing services and legacy copy remain the authority.
- **Change:** Normalized 0 small touch targets to 44px, 11 teal text uses to accessible deep teal, and safe `min-w-0` containment / shell landmark handling as applicable. Did not replace permission checks, filters, submission logic or existing error/empty copy.
- **States:** Original no-scope, denied, loading, existing list/form actions and service errors are unchanged. Browser/WebView and screen-reader checks pending orchestrator run.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-colleges-collegeId-01`.

## Bounded slow-network fallback
- Existing loading heading and accessible announcement “Loading tenant identity and lifecycle in the current safety scope…” are preserved. Replaced the unbounded shared `LoadingState` with shared `GracefulPageLoading` for reduced-motion skeletons and a 12-second retry affordance. Source test: `UX-admin-colleges-collegeId-03`.

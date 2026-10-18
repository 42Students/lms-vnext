# UX — /admin/colleges/[collegeId]/branding

- **Before / review:** Audited this exact route against the signed-off playbook for 320px containment, focus/touch sizing, contrast, loading/empty/error and role-scoped actions. Existing services and legacy copy remain the authority.
- **Change:** Normalized 2 small touch targets to 44px, 2 teal text uses to accessible deep teal, and safe `min-w-0` containment / shell landmark handling as applicable; added the missing shared PageHeader while retaining the “Look and feel” heading. Did not replace permission checks, filters, submission logic or existing error/empty copy.
- **States:** Original no-scope, denied, loading, existing list/form actions and service errors are unchanged. Browser/WebView and screen-reader checks pending orchestrator run.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-colleges-collegeId-branding-01`.

## Bounded slow-network fallback
- Existing loading heading and accessible announcement “Loading branding preview…” are preserved. Replaced the unbounded shared `LoadingState` with shared `GracefulPageLoading` for reduced-motion skeletons and a 12-second retry affordance. Source test: `UX-admin-colleges-collegeId-branding-03`.

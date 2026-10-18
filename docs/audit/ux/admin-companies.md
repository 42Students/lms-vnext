# UX — /admin/companies

- **Before / review:** Audited this exact route against the signed-off playbook for 320px containment, focus/touch sizing, contrast, loading/empty/error and role-scoped actions. Existing services and legacy copy remain the authority.
- **Change:** Normalized 5 small touch targets to 44px, 12 teal text uses to accessible deep teal, and safe `min-w-0` containment / shell landmark handling as applicable. Did not replace permission checks, filters, submission logic or existing error/empty copy.
- **States:** Original no-scope, denied, loading, existing list/form actions and service errors are unchanged. Browser/WebView and screen-reader checks pending orchestrator run.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-companies-01`.

## Bounded loading and retry
- Upgraded the indefinite skeleton to `GracefulPageLoading` while retaining “Loading company directory”. A reduced-motion loading shape and 12-second recovery control are provided; source test `UX-admin-companies-03`.

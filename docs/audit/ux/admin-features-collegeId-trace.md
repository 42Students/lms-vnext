# UX — /admin/features/[collegeId]/trace

- **Before / review:** Audited the route's existing scopes, action copy, feedback and filters against the signed-off LMS 320px/WebView playbook. Several details had 40px click targets, non-AA decorative teal in small links or insufficient flex containment.
- **After:** Existing hierarchy/logic preserved; changed 5 touch targets to 44px, 8 small teal text uses to deep-teal and inserted safe `min-w-0` where needed. No user-facing labels or privilege checks changed, and no bespoke UI controls were introduced.
- **States:** Existing filtered empty, invalid query, missing record, cross-scope denial and mutation errors are still owned by the unchanged service/component branches. Device, focus-trap and SR evidence pending orchestrator.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-features-collegeId-trace-01`.

## Learner trace interaction follow-up
- Learner selection now uses the shared mobile-card `DataTable` with the original searchable learner, roll, and Explain access link; exact query filters and active learner selection remain in its href. The resolution matrix retains horizontal scrolling but fixes its Resolution level header/row to the left so winning and ignored steps remain identifiable on phones. See `UX-admin-features-collegeId-trace-02`.

## Bounded loading recovery
- Kept the existing PageHeader and “Resolving learner module access…” announcement while replacing indefinite `LoadingState` with the shared `GracefulPageLoading` retry/skeleton behavior. Test `UX-admin-features-collegeId-trace-03`.

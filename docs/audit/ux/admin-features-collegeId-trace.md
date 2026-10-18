# UX — /admin/features/[collegeId]/trace

- **Before / review:** Audited the route's existing scopes, action copy, feedback and filters against the signed-off LMS 320px/WebView playbook. Several details had 40px click targets, non-AA decorative teal in small links or insufficient flex containment.
- **After:** Existing hierarchy/logic preserved; changed 5 touch targets to 44px, 8 small teal text uses to deep-teal and inserted safe `min-w-0` where needed. No user-facing labels or privilege checks changed, and no bespoke UI controls were introduced.
- **States:** Existing filtered empty, invalid query, missing record, cross-scope denial and mutation errors are still owned by the unchanged service/component branches. Device, focus-trap and SR evidence pending orchestrator.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-features-collegeId-trace-01`.

## Learner trace interaction follow-up
- Learner selection now uses the shared mobile-card `DataTable` with the original searchable learner, roll, and Explain access link; exact query filters and active learner selection remain in its href. The resolution matrix retains horizontal scrolling but fixes its Resolution level header/row to the left so winning and ignored steps remain identifiable on phones. See `UX-admin-features-collegeId-trace-02`.

## Bounded loading recovery
- Kept the existing PageHeader and “Resolving learner module access…” announcement while replacing indefinite `LoadingState` with the shared `GracefulPageLoading` retry/skeleton behavior. Test `UX-admin-features-collegeId-trace-03`.

## Cross-audit chat-12 — MAJOR form control correction

The features-collegeId-trace read-only filter surface still used raw browser selects/search or action button markup. These bypass the audited shared 16px and 44px focus contract at 320/360/390; some text-form controls inherited 14px iOS zoom behavior. Replaced `Input`×1, `Select`×3, `Button`×1 with shared UI primitives, retaining query parameter names, labels, defaults, scope, and service behavior. Test: `tests/unit/UX-admin-features-collegeId-trace-12-01.test.ts`. No edit/delete behavior changed; runtime/AT validation pending.

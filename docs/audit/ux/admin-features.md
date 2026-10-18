# UX — /admin/features

- **Before / review:** Audited the route's existing scopes, action copy, feedback and filters against the signed-off LMS 320px/WebView playbook. Several details had 40px click targets, non-AA decorative teal in small links or insufficient flex containment.
- **After:** Existing hierarchy/logic preserved; changed 6 touch targets to 44px, 9 small teal text uses to deep-teal and inserted safe `min-w-0` where needed. No user-facing labels or privilege checks changed, and no bespoke UI controls were introduced.
- **States:** Existing filtered empty, invalid query, missing record, cross-scope denial and mutation errors are still owned by the unchanged service/component branches. Device, focus-trap and SR evidence pending orchestrator.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-features-01`.

## Bounded slow-network fallback
- Existing loading heading and accessible announcement “Loading college feature matrix…” are preserved. Replaced the unbounded shared `LoadingState` with shared `GracefulPageLoading` for reduced-motion skeletons and a 12-second retry affordance. Source test: `UX-admin-features-03`.

## Single responsive module matrix
- Replaced two independently mounted mobile cards and desktop table (including duplicate editable form instances) with a shared responsive `DataTable`. Mobile cards retain module state, Change control, hierarchy link, and stored/locked summary. `DataTable.empty` receives the existing scoped empty copy, and all live permission editors mount once per row. CSV export, URL-based filters and paging are unchanged. Test `UX-admin-features-02`.

## Cross-audit chat-12 — MAJOR form control correction

The features read-only filter surface still used raw browser selects/search or action button markup. These bypass the audited shared 16px and 44px focus contract at 320/360/390; some text-form controls inherited 14px iOS zoom behavior. Replaced `Input`×1, `Select`×7, `Button`×1 with shared UI primitives, retaining query parameter names, labels, defaults, scope, and service behavior. Test: `tests/unit/UX-admin-features-12-01.test.ts`. No edit/delete behavior changed; runtime/AT validation pending.

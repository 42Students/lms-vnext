# UX — /admin/features/[collegeId]/students/[membershipId]/history

- **Before / review:** Audited the route's existing scopes, action copy, feedback and filters against the signed-off LMS 320px/WebView playbook. Several details had 40px click targets, non-AA decorative teal in small links or insufficient flex containment.
- **After:** Existing hierarchy/logic preserved; changed 0 touch targets to 44px, 5 small teal text uses to deep-teal and inserted safe `min-w-0` where needed. No user-facing labels or privilege checks changed, and no bespoke UI controls were introduced.
- **States:** Existing filtered empty, invalid query, missing record, cross-scope denial and mutation errors are still owned by the unchanged service/component branches. Device, focus-trap and SR evidence pending orchestrator.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-features-collegeId-students-membershipId-history-01`.

## Cross-audit chat-12 — MAJOR form control correction

The features-collegeId-students-membershipId-history read-only filter surface still used raw browser selects/search or action button markup. These bypass the audited shared 16px and 44px focus contract at 320/360/390; some text-form controls inherited 14px iOS zoom behavior. Replaced `Input`×3, `Select`×1, `Button`×1 with shared UI primitives, retaining query parameter names, labels, defaults, scope, and service behavior. Test: `tests/unit/UX-admin-features-collegeId-students-membershipId-history-12-01.test.ts`. No edit/delete behavior changed; runtime/AT validation pending.

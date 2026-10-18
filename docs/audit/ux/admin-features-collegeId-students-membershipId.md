# UX — /admin/features/[collegeId]/students/[membershipId]

- **Before / review:** Audited the route's existing scopes, action copy, feedback and filters against the signed-off LMS 320px/WebView playbook. Several details had 40px click targets, non-AA decorative teal in small links or insufficient flex containment.
- **After:** Existing hierarchy/logic preserved; changed 0 touch targets to 44px, 2 small teal text uses to deep-teal and inserted safe `min-w-0` where needed. No user-facing labels or privilege checks changed, and no bespoke UI controls were introduced.
- **States:** Existing filtered empty, invalid query, missing record, cross-scope denial and mutation errors are still owned by the unchanged service/component branches. Device, focus-trap and SR evidence pending orchestrator.
- **Test:** `tests/unit/ux-admin-first-third.test.ts` → `UX-admin-features-collegeId-students-membershipId-01`.

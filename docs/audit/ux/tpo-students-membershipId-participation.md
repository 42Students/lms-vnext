# /tpo/students/[membershipId]/participation — UX rollout

- **Source review and fix:** Expanded compact interactive controls to the 44px minimum.
- **Preserved:** Exact existing titles and action wording, tenant authorization, current search/filter state, empty and error cases, versioned actions and student privacy constraints.
- **Scope:** This route is in the final third of the TPO rollout. Changes use existing shared PageHeader or touch target design-system utility tokens, not a forked component.
- **Test:** `tests/unit/chat2-ux-tpo-students-team.test.ts` — `UX-tpo-tpo-students-membershipId-participation-01`.
- **Pending verification:** Unit/typecheck/lint and narrow-viewport, keyboard, assistive-technology/browser runs were not executed; do not tick as passing before CI.

## Independent chat-5 traceability follow-up (UX-tpo-students-membershipid-participation-02)

- **UX-CROSS-TPO-NOTE:** Reviewed `/tpo/students/[membershipId]/participation` against its server page and surfaced explicit state/security follow-ups rather than claiming a browser pass.
- **Route and tenant checks:** TPO role is redirected server-side; `getTpoLearnerParticipation` is the source of learner/membership scope. Both eligibility and timed/drive-based debarments are separate operations.
- **Responsive and loading/error states:** Loading and error boundaries require browser evidence; page displays effective decision and provenance before controls, explicit rollback/concurrency copy and 44px navigation.
- **Remaining release checks:** Wrong-college membership ID, deactivated TPO session, double decision submits, stale expected versions and private reason exposure require integration tests.
- **Test trail:** `tests/unit/chat5-ux-cross-tpo-last.test.ts` UX-tpo-students-membershipid-participation-02; source contract only, not a successful runtime test assertion.

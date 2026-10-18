# /tpo/team/[threadId] — UX rollout

- **Source review and fix:** Retained existing shared header, scope checks and responsive source behavior after review.
- **Preserved:** Exact existing titles and action wording, tenant authorization, current search/filter state, empty and error cases, versioned actions and student privacy constraints.
- **Scope:** This route is in the final third of the TPO rollout. Changes use existing shared PageHeader or touch target design-system utility tokens, not a forked component.
- **Test:** `tests/unit/chat2-ux-tpo-students-team.test.ts` — `UX-tpo-tpo-team-threadId-01`.
- **Pending verification:** Unit/typecheck/lint and narrow-viewport, keyboard, assistive-technology/browser runs were not executed; do not tick as passing before CI.

## Independent chat-5 traceability follow-up (UX-tpo-team-threadid-02)

- **UX-CROSS-TPO-NOTE:** Reviewed `/tpo/team/[threadId]` against its server page and surfaced explicit state/security follow-ups rather than claiming a browser pass.
- **Route and tenant checks:** Thread/page input must pass `tpoThreadIdSchema` and `tpoMessagePageSchema`; membership gate uses `hasPlacementTeamMembership`; unreadable thread yields notFound.
- **Responsive and loading/error states:** Loading and error boundaries require browser evidence; NOT_REGISTERED has a friendly state, asks failure is isolated with role alert, empty thread shows status copy and messages paginate.
- **Remaining release checks:** Direct POST acknowledge route requires origin/session/tenant tests, stale message action conflict tests and WebView keyboard/focus checks.
- **Test trail:** `tests/unit/chat5-ux-cross-tpo-last.test.ts` UX-tpo-team-threadid-02; source contract only, not a successful runtime test assertion.

# /tpo/settings/trusted — UX rollout

- **Source review and fix:** Expanded compact interactive controls to the 44px minimum.
- **Preserved:** Exact existing titles and action wording, tenant authorization, current search/filter state, empty and error cases, versioned actions and student privacy constraints.
- **Scope:** This route is in the final third of the TPO rollout. Changes use existing shared PageHeader or touch target design-system utility tokens, not a forked component.
- **Test:** `tests/unit/chat2-ux-tpo-students-team.test.ts` — `UX-tpo-tpo-settings-trusted-01`.
- **Pending verification:** Unit/typecheck/lint and narrow-viewport, keyboard, assistive-technology/browser runs were not executed; do not tick as passing before CI.

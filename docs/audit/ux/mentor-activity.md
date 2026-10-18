# UX source review — `/mentor/activity`

- **Owner / playbook:** chat-14, signed-off `docs/design-system/UX-PLAYBOOK.md`. Route unchanged: `src/app/(authenticated)/mentor/activity/page.tsx`.
- **Observed risk:** viewport overflow, sub-44px tap targets and/or inaccessible horizontal table scrolling where present.
- **Changes:** 44px minimum touch targets (11).
- **States/authority:** Existing legacy wording, server permissions, loading/empty/error paths, links, forms and data readers preserved; no fabricated status or mutation.
- **Test:** `tests/unit/ux-chat14-mentor-01.test.ts` — `UX-mentor-mentor-activity-01`.
- **Verification:** source contract authored; TypeScript, unit and 320/360/390 browser checks pending orchestrator. Do not tick inventory until run.

## Mentor-only quality pass
- Accessible deep-teal links: 7; visible keyboard focus rings: 7; shared submit buttons: 1.
- Kept exact legacy copy, forms, tenant authorization, and all original result/error branches.
- Regression `UX-mentor-activity-02` in `tests/unit/ux-chat14-mentor-quality-04a.test.ts`; TypeScript/Vitest/device QA not yet executed.

# UX source review — `/mentor/projects/[projectId]/activity-history`

- **Owner / playbook:** chat-14, signed-off `docs/design-system/UX-PLAYBOOK.md`. Route unchanged: `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx`.
- **Observed risk:** viewport overflow, sub-44px tap targets and/or inaccessible horizontal table scrolling where present.
- **Changes:** 44px minimum touch targets (7).
- **States/authority:** Existing legacy wording, server permissions, loading/empty/error paths, links, forms and data readers preserved; no fabricated status or mutation.
- **Test:** `tests/unit/ux-chat14-mentor-01.test.ts` — `UX-mentor-mentor-projects-projectId-activity-history-01`.
- **Verification:** source contract authored; TypeScript, unit and 320/360/390 browser checks pending orchestrator. Do not tick inventory until run.

## Mentor-only quality pass
- Deep-teal text contrast fixes: 6; keyboard focus rings: 6; shared primary submit buttons: 1.
- Exact legacy copy, disabled/read-only states, role checks, filters and navigation preserved.
- Source test `UX-mentor-projects-projectId-activity-history-02` in `tests/unit/ux-chat14-mentor-quality-04b.test.ts`; runtime QA pending.

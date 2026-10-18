# UX source review — `/mentor/projects/[projectId]/closeout`

- **Owner / playbook:** chat-14, signed-off `docs/design-system/UX-PLAYBOOK.md`. Route unchanged: `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx`.
- **Observed risk:** viewport overflow, sub-44px tap targets and/or inaccessible horizontal table scrolling where present.
- **Changes:** Responsive no-overflow page container.
- **States/authority:** Existing legacy wording, server permissions, loading/empty/error paths, links, forms and data readers preserved; no fabricated status or mutation.
- **Test:** `tests/unit/ux-chat14-mentor-01.test.ts` — `UX-mentor-mentor-projects-projectId-closeout-01`.
- **Verification:** source contract authored; TypeScript, unit and 320/360/390 browser checks pending orchestrator. Do not tick inventory until run.

## Mentor-only quality pass
- Deep-teal text contrast fixes: 1; keyboard focus rings: 1; shared primary submit buttons: 0.
- Exact legacy copy, disabled/read-only states, role checks, filters and navigation preserved.
- Source test `UX-mentor-projects-projectId-closeout-02` in `tests/unit/ux-chat14-mentor-quality-04b.test.ts`; runtime QA pending.

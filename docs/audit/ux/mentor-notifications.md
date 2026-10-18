# UX source review — `/mentor/notifications`

- **Owner / playbook:** chat-14, signed-off `docs/design-system/UX-PLAYBOOK.md`. Route unchanged: `src/app/(authenticated)/mentor/notifications/page.tsx`.
- **Observed risk:** viewport overflow, sub-44px tap targets and/or inaccessible horizontal table scrolling where present.
- **Changes:** Responsive no-overflow page container; 44px minimum touch targets (6).
- **States/authority:** Existing legacy wording, server permissions, loading/empty/error paths, links, forms and data readers preserved; no fabricated status or mutation.
- **Test:** `tests/unit/ux-chat14-mentor-01.test.ts` — `UX-mentor-mentor-notifications-01`.
- **Verification:** source contract authored; TypeScript, unit and 320/360/390 browser checks pending orchestrator. Do not tick inventory until run.

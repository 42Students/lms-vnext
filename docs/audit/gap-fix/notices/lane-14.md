# Notice for lane 14 (read and apply FIRST)

NO DEADLINE NOW: keep working until your queues are fully ticked (the 19:15 freeze is cancelled).

1) Finish anything unticked in docs/orchestrator/queues/clone/lane-14-ci10.md.
2) docs/orchestrator/queues/clone/lane-14-verify2b.md to the END: tick rows that already match the old LMS immediately; fix only REAL gaps, smallest correct change; no long notes.
3) Push to chatgpt/chat-14-b after EVERY packet. Never wait for CI.
Rules: keep every test passing; keep TypeScript valid (keep exports other files import; close every JSX fragment; parse unknown bodies with the existing zod schema; no duplicate declarations); never silence errors (no any, @ts-ignore, @ts-expect-error, eslint-disable, .skip); links open in the same tab (no target=_blank, no window.open); never add src/app/(authenticated)/mentor/courses/[courseId]/page.tsx; new dynamic route folders must reuse the existing sibling param name.

# Notice for lane 9 (read and apply FIRST)

HEAVY LIFTING, NO DEADLINE (owner): do AT LEAST 4 full packets per turn back to back without stopping to report; keep going until your queues (including any "More packets" section) are fully ticked.

1) Finish anything unticked in docs/orchestrator/queues/clone/lane-9-ci10.md.
2) docs/orchestrator/queues/clone/lane-9-verify2b.md to the END: tick rows that already match the old LMS immediately; fix only REAL gaps, smallest correct change; no long notes.
3) Push to chatgpt/chat-9-b after EVERY packet. Never wait for CI.
Rules: keep every test passing; keep TypeScript valid (keep exports other files import; close every JSX fragment; parse unknown bodies with the existing zod schema; no duplicate declarations); never silence errors (no any, @ts-ignore, @ts-expect-error, eslint-disable, .skip); links open in the same tab (no target=_blank, no window.open); never add src/app/(authenticated)/mentor/courses/[courseId]/page.tsx; new dynamic route folders must reuse the existing sibling param name.

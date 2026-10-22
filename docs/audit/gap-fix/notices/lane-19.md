# Notice for lane 19 (read and apply FIRST)

HARD DEADLINE 19:15 IST (13:45 UTC) today: after that, push your last finished packet and STOP (dev deploy follows).

FAST MODE until then:
1) Finish anything unticked in docs/orchestrator/queues/clone/lane-19-ci10.md (and lane-19-ci11.md if it appears).
2) docs/orchestrator/queues/clone/lane-19-verify2b.md: for each row, if vNext already matches the old LMS, tick it immediately; fix only REAL gaps, smallest correct change. Do not write long notes.
3) Push to chatgpt/chat-19-b after EVERY packet (unpushed work is lost at the deadline). Never wait for CI.
Rules: keep every test passing; keep TypeScript valid (keep exports other files import; parse unknown bodies with the existing zod schema); never silence errors (no any, @ts-ignore, @ts-expect-error, eslint-disable, .skip); never add src/app/(authenticated)/mentor/courses/[courseId]/page.tsx.

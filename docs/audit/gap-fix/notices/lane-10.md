# Notice for lane 10 (read and apply FIRST)

FAST VERIFICATION MODE (owner, 22 Oct 21:00): finish docs/orchestrator/queues/clone/lane-10-verify2b.md (including any "More packets" section) as fast as possible.

Per packet:
1) Read all 25 rows at once. For each row, do ONE quick check (grep the vNext code for the page/route/field/label the row names).
2) Rows where vNext clearly already does it: mark them OK together in one go, no long notes.
3) Spend your time ONLY on rows that are clearly missing or wrong: fix them with the smallest correct change.
4) Rows that need deep investigation: mark DEFERRED with one line why, and move on (they go to the polish pass).
5) Push to chatgpt/chat-10-b and tick the packet in your queue file, then IMMEDIATELY start the next packet. Aim for one packet every 10-15 minutes.

Rules: keep every test passing; keep TypeScript valid (keep exports, close JSX fragments, no duplicate declarations, parse unknown bodies with the existing zod schema); same-tab links only; never silence errors (no any, @ts-ignore, @ts-expect-error, eslint-disable, .skip). Do not reply with status reports; reply only after several packets are pushed.

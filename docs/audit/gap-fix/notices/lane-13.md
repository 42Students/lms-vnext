# Notice for lane 13 (read and apply FIRST)

CORRECTION (22 Oct 21:45): fast mode let 925 rows be marked DEFERRED without being checked. That is NOT verification. From now on DEFERRED is not allowed anywhere.

ORDER:
1) Anything still unticked in docs/orchestrator/queues/clone/lane-13-verify2c.md: every row must be OK (with the vNext file:line AND the docs/legacy-source file it matches) or FIXED. No DEFERRED.
2) docs/orchestrator/queues/clone/lane-13-deep.md: 10-row packets of the rows that were deferred. Same rule: every row OK with evidence, or FIXED.

Per packet: write one result line per row under "## Results" in the packet file, push to chatgpt/chat-13-b, tick the packet in your queue, start the next immediately. No status reports. Keep tests passing and TypeScript valid (keep exports, close JSX fragments, no duplicate declarations, effect cleanups return nothing); same-tab links only; never silence errors.

# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-18-026-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-19-019-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-19-022-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-19-029-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_3.md)
- [ ] G2-3-025-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_9.md)

## Results


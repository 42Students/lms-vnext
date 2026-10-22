# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-7-030-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-11-026-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-11-029-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-13-023-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-14-029-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-14-030-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-17-031-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-19-027-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-5-022-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-5-022-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)

## Results


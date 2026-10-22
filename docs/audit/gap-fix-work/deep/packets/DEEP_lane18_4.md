# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-13-031-085  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-14-028-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-005-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-017-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-017-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-017-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-022-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-029-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-4-029-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-5-004-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)

## Results


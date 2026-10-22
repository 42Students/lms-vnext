# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-18-013-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-12-024-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-021-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-021-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)

## Results


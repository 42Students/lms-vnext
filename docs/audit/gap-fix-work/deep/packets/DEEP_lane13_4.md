# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-11-013-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-076  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-086  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-088  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-090  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-091  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-12-019-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-12-019-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)

## Results


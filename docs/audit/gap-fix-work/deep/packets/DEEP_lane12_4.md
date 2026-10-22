# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-11-011-101  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-011-107  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-011-110  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-011-112  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-011-117  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-013-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)

## Results


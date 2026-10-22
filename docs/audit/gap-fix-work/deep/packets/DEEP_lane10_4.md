# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-2-016-104  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-106  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-108  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-111  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-137  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-149  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-156  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-159  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-166  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-020-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)

## Results


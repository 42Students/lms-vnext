# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-6-020-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_9.md)
- [ ] G2-15-030-041  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-19-022-076  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-19-022-089  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-084  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-087  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-016-095  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)

## Results


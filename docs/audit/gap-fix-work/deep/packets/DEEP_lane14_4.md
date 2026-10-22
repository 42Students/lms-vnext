# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-12-019-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-14-011-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_7.md)
- [ ] G2-14-011-076  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-012-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-012-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-012-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-015-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-015-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-015-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-14-017-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)

## Results


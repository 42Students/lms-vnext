# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-2-020-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-020-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-2-021-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_12.md)
- [ ] G2-4-023-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_15.md)
- [ ] G2-4-023-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_15.md)
- [ ] G2-5-023-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_15.md)
- [ ] G2-11-011-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-011-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-011-078  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)
- [ ] G2-11-011-089  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_5.md)

## Results


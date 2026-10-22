# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-5-007-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-009-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-011-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-026-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-027-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-027-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-027-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-027-060  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-031-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)
- [ ] G2-5-032-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_10.md)

## Results


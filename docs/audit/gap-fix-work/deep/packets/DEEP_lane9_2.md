# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-4-028-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-12-016-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-13-031-098  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-19-025-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-001-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-005-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-006-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-007-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-009-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-011-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)

## Results


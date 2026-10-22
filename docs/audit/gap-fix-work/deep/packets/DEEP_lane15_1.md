# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-3-024-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-3-024-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-3-024-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-3-024-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-15-031-062  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-19-023-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-19-023-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-010-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-010-005  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)
- [ ] G2-3-010-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_12.md)

## Results


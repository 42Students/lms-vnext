# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-9-014-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-9-014-086  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-9-016-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-15-017-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_7.md)
- [ ] G2-9-034-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_7.md)
- [ ] G2-13-025-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-15-017-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-15-017-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-010-041  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-010-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)

## Results


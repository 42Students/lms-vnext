# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-7-015-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-015-084  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-016-042  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-017-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-018-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-021-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-021-056  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-027-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-027-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)
- [ ] G2-7-028-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_9.md)

## Results


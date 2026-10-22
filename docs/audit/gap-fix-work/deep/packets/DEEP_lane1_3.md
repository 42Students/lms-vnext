# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-9-025-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-025-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-027-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-19-028-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-017-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-022-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-023-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-030-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-030-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)
- [ ] G2-8-030-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_6.md)

## Results


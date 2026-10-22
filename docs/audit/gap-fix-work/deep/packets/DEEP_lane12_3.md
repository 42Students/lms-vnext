# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-7-009-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-7-011-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-7-013-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_8.md)
- [ ] G2-8-5-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_9.md)
- [ ] G2-11-017-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-11-023-035  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-11-029-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-14-029-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-4-022-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)
- [ ] G2-4-022-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-20/W1_lane20_5.md)

## Results


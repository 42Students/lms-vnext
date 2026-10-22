# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-9-008-075  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-008-078  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-008-079  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-015-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-015-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-015-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-015-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-016-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-016-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_8.md)
- [ ] G2-9-022-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_13.md)

## Results


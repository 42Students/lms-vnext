# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-8-018-076  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-018-079  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-018-084  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-066  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-070  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-020-071  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)

## Results


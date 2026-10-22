# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-5-018-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-019-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-019-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-11-018-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-11-018-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-11-024-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-19-028-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-018-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-018-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)
- [ ] G2-8-018-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_24.md)

## Results


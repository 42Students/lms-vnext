# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-18-006-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-18-006-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-18-006-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-18-006-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-001-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-003-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-018-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-018-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-018-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)
- [ ] G2-19-018-041  (source: docs/audit/gap-fix-work/verify2/packets/lane-8/W1_lane8_5.md)

## Results


# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-19-001-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-19-001-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-19-010-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-19-010-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-19-010-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-001-067  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-002-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-006-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-006-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-2-010-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)

## Results


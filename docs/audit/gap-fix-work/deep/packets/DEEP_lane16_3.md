# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-8-020-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-020-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-020-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-020-028  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-020-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-020-061  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-021-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-022-039  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-023-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-8-024-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)

## Results


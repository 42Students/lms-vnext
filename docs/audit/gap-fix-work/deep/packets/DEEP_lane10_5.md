# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-8-022-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [ ] G2-9-001-074  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [ ] G2-9-007-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [ ] G2-9-012-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [ ] G2-9-013-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [ ] G2-9-014-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [ ] G2-9-015-056  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [ ] G2-9-020-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [ ] G2-9-020-060  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)
- [ ] G2-9-029-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)

## Results


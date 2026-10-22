# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-20-010-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-20-012-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-3-001-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-3-019-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-3-019-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-004-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-013-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-026-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-026-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)
- [ ] G2-4-026-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_8.md)

## Results


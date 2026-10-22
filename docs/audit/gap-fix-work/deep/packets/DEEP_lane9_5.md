# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-4-005-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [ ] G2-4-007-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [ ] G2-4-010-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [ ] G2-4-010-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [ ] G2-4-010-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [ ] G2-4-019-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [ ] G2-4-019-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [ ] G2-4-032-034  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [ ] G2-4-032-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_10.md)
- [ ] G2-15-027-041  (source: docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_14.md)

## Results


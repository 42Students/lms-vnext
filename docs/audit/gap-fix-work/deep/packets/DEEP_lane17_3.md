# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-8-027-049  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-9-007-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-9-009-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_19.md)
- [ ] G2-9-014-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_20.md)
- [ ] G2-9-016-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_20.md)
- [ ] G2-9-025-066  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_20.md)
- [ ] G2-15-008-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-15-008-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-15-008-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)
- [ ] G2-15-008-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_6.md)

## Results


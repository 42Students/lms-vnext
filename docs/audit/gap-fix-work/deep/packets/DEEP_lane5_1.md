# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-9-036-120  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-9-036-122  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-16-005-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_4.md)
- [ ] G2-11-022-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-13-030-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-13-030-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-13-030-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-13-030-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-13-030-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-13-031-090  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)

## Results


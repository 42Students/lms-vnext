# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-9-010-084  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-010-087  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-011-015  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-011-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-011-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-014-027  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-014-090  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-016-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-016-095  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)
- [ ] G2-9-016-096  (source: docs/audit/gap-fix-work/verify2/packets/lane-19/W1_lane19_11.md)

## Results


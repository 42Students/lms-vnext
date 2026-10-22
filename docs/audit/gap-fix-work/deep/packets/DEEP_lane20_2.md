# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-9-008-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-010-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-010-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-010-080  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-011-037  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-014-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-014-079  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-018-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-025-055  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-025-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)

## Results

- G2-9-008-047: OK — class-level reporting is expressly removed as a vNext policy rather than misrepresented as a cohort filter, with explanation and strict rejection of unsupported `classId` at `src/modules/placements/college-hiring-analytics-model.ts:3-10,11-26,43-57`. Legacy accepts optional class-related filtering through `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:170-195`. This is documented feature removal, not class-filter parity.


# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-11-022-077  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-12-023-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-12-023-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-12-023-072  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-15-021-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-006-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-009-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-009-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-009-032  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)
- [ ] G2-20-009-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_11.md)

## Results

- OK G2-11-022-077 — `src/app/(authenticated)/tpo/reports/page.tsx:251-293` renders an immediately visible, accessible, linked Placement journey before report cards, including Looking for a job, Placed, Accepted, Unplaced, Not accepted yet, counts and percentages. Matches `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:62-74` (JourneyStrip, stage and gap destinations).

# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-8-022-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-8-028-051  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-8-028-058  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-8-028-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-002-087  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-008-006  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-008-011  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [x] G2-9-008-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [x] G2-9-008-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)
- [ ] G2-9-008-031  (source: docs/audit/gap-fix-work/verify2/packets/lane-17/W1_lane17_10.md)

## Results

- G2-9-008-020: OK — `src/components/placements/college-hiring-funnel.tsx:30-37,94-103` clears the Program selection on Department change and filters programs to the selected department, matching `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:352-366`.
- G2-9-008-022: OK — `src/components/placements/college-hiring-funnel.tsx:90-126` keeps jobId, departmentId, programId, cohortId and date inputs in the GET filter form, and Clear all navigates via `collegeHiringAnalyticsHref({})` without any of those filters, matching `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:225-231`.

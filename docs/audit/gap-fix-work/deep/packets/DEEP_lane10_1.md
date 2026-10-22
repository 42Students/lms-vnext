# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-6-018-041  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-6-019-039  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [ ] G2-6-031-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_6.md)
- [x] G2-11-019-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-11-019-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-11-019-059  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-11-019-077  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-11-019-079  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [x] G2-11-022-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)
- [ ] G2-19-001-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-12/W1_lane12_4.md)

## Results

- OK G2-11-019-059 — `src/components/tpo/recruiter-lead-detail-workspace.tsx:380-405,574-576` and `src/app/api/placements/tpo/leads/[leadId]/invite/route.ts:22-50` now provide explicit send-email path (503 when not configured), matching `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-205`.
- OK G2-11-019-079 — `src/components/tpo/recruiter-lead-detail-workspace.tsx:380-405,574-576` contains direct Send invite email action alongside manual option, matching `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-205`.
- OK G2-11-019-029 — `src/components/tpo/recruiter-lead-detail-workspace.tsx:380-405,574-576` and `src/app/api/placements/tpo/leads/[leadId]/invite/route.ts:22-50` implement confirmed email dispatch with provider acceptance and explicit unavailable error; matches invite dispatch from `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:204-205` (email sending is conditioned on verified delivery configuration).
- OK G2-11-022-020 — `src/app/(authenticated)/tpo/reports/page.tsx:232-233,280` and `src/modules/placements/report-service.ts:82-98` preserve distinct student counts and placed-minus-accepted gap; matches `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-72`.
- FIXED G2-11-019-077 — `e378f15dce821a4ac0861dd3b62ce7bbb014a602` — `src/components/tpo/recruiter-lead-detail-workspace.tsx:487-491`; matched `docs/legacy-source/frontend/src/pages/tpo/recruiters/[recruiterLeadId].js:206-207` (company-only Team talk URL).

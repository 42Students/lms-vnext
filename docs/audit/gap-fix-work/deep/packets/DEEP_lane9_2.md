# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [x] G2-4-028-012  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_19.md)
- [ ] G2-12-016-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [x] G2-13-031-098  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [x] G2-19-025-050  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-001-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [x] G2-5-005-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-006-069  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-007-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-009-046  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)
- [ ] G2-5-011-047  (source: docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_20.md)

## Results
- OK G2-4-028-012 — `src/app/(authenticated)/tpo/settings/team/page.tsx:7,228-239` renders guarded TpoSettingsTeamRemove in the team roster; legacy `docs/legacy-source/frontend/src/components/tpo/team/TeamPeople.jsx:79-86`.
- OK G2-13-031-098 — `src/app/(authenticated)/tpo/reports/by-company/page.tsx:70-81,108` provides both full-filtered company CSV and visible-page CSV while retaining selected filters; legacy `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:134-135`.
- OK G2-5-005-026 — `src/app/(authenticated)/recruiter/calendar/page.tsx:1` reuses the recruiter HR calendar; `src/app/(authenticated)/hr/calendar/error.tsx:1-20` catches calendar load exceptions and offers Retry via reset without treating failure as an empty calendar; legacy `docs/legacy-source/frontend/src/pages/recruiter/calendar.js:18,61`.
- OK G2-19-025-050 — `src/app/api/v1/public/tenant-bootstrap/route.ts:15-19,69-105` exposes an explicitly versioned UUID identifier contract (`idFormat: "uuid"`) and preserves `legacyUniqueId` as `tenantKey`, never passing UUID identifiers off as numeric legacy IDs; `src/modules/auth/request-tenant.ts:105-116` gates the published college/organization identity on a verified college host. Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTenantController.java:81-87` exposes legacy integer college/org IDs and uniqueId. The versioned adapter makes the deliberate identifier difference explicit without coercion.\n
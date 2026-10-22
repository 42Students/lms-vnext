# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-9-036-120  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [x] G2-9-036-122  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_14.md)
- [ ] G2-16-005-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_4.md)
- [x] G2-11-022-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-13-030-002  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-13-030-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-13-030-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-13-030-036  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [ ] G2-13-030-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)
- [x] G2-13-031-090  (source: docs/audit/gap-fix-work/verify2/packets/lane-11/W1_lane11_5.md)

## Results

- G2-9-036-122 — OK: `src/modules/module-access/service.ts:120-129,155-156,170-172` ignores membership, section, cohort, program and department overrides for Placements; matches `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ModuleFeatureCatalog.java:63-67,79-85` (college-only module policy). Learner eligibility remains independently enforced by placement services.
- G2-11-022-019 — OK: `src/app/(authenticated)/tpo/reports/page.tsx:233,253,284-292,375` uses `studentsAccepted` for accepted learners, separates raw offer count, and explicitly warns against mixing denominators; matches `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-72` (`acceptedUnique` is distinct from `offers`).
- G2-13-030-002 — OK: `src/modules/placements/result-service.ts:241-275` resolves the legacy interview identifier to the booked candidate slot, round, application and college-scoped job, checking placement manage permission before enabling feedback; matches the interview-context requirement in `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:8-19`.
- G2-13-030-036 — OK: `src/modules/placements/result-service.ts:264-273` explicitly distinguishes applying a rejection (in-app learner notice) from a separately confirmed offer workflow; matches the candidate-notification warning intent in `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:127-143`, without falsely claiming legacy automatic HIRE transitions are preserved.
- G2-13-031-090 — FIXED: `79df0d83ff8dad12364723abe2e902e78a5d5684`, `src/modules/placements/tpo-failure-round-share-model.ts` counts `ABSENT` alongside `FAIL` in both per-round and per-branch applied-result numerators, preserving applied-result denominators; legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:645-655`.

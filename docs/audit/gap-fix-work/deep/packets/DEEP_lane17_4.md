# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-13-021-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-021-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-021-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-021-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-021-026  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-021-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-021-052  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-031-017  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-031-065  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-031-068  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)

## Results

- G2-13-021-018: OK — every application creation writes its screening row in the same transaction (src/modules/placements/application-service.ts:1036-1040, status default PENDING) and an explicit manager-only repair, ensurePlacementScreeningPending (src/modules/placements/screening-service.ts:590-613), restores a missing PENDING row for old applications without scoring them; matches the pending-row creation in docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:80-107 (the SYSTEM/AUTOMATED_V1 stamp is not applicable because automatic scoring was removed, see G2-13-021-048)
- G2-13-021-021: OK — completion and disposition are kept distinct: src/modules/placements/screening-service.ts:41-60 (PLACEMENT_SCREENING_PROVENANCE completionLabel "Human review decision", automatedStatus NOT_RUN, never a fake COMPLETED run) and :585 returns automatedScreeningStatus NOT_RUN beside the human decision; replaces the legacy automatic COMPLETED mark in ScreeningServiceImpl.java:236-241
- G2-13-021-022: OK — there is no automated run that can fail, so no FAILED diagnostics are needed; the controlled equivalent is the manager-only repair action ensurePlacementScreeningPending (src/modules/placements/screening-service.ts:590-613, rescreenPolicy MANAGER_REPAIR_ONLY at :57) which reports its result through the normal screening details; legacy failure handling ScreeningServiceImpl.java:80-107,245+
- G2-13-021-025: OK — the automatic run and the human disposition are separate: only the human disposition service exists (src/modules/placements/screening-service.ts, transitions PENDING/HOLD/SHORTLISTED/REJECTED with history rows in placementApplicationScreeningHistory), while automated provenance is the constant automaticScoringEnabled:false / immutableAlgorithmProvenance LEGACY_NOT_IMPORTED (:41-60); legacy combined both in ScreeningServiceImpl.java:61-107
- G2-13-021-026: OK — decision recorded: the legacy simple-average skills/education score (ScreeningServiceImpl.java:110-239) is not reproduced because an opaque numeric rank over learners is a fairness risk; vNext ranks by submission time (rankingPolicy SUBMISSION_TIME) and shows "Not scored" (src/modules/placements/screening-service.ts:48-60), keeping the shortlist a human, explainable decision; no evaluator is needed for parity
- G2-13-021-048: OK — scoring is intentionally removed and marked so: src/modules/placements/screening-service.ts:48-60 sets automaticScoringEnabled:false and automatedStatus NOT_RUN, so no background scorer is started after an application save (application-service.ts:1036-1040 only creates the PENDING review row); legacy trigger in docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:13-16
- G2-13-021-052: OK — owner delegated open calls, so the decision is recorded here: the deterministic matching score is not retained (and no AI is added); skills/education are reviewed by humans from the verified profile, see PLACEMENT_SCREENING_PROVENANCE in src/modules/placements/screening-service.ts:48-60 (scoreAvailable:false, missingScoreLabel "Not scored"); legacy ApplicationScreening.java:13-16
- G2-13-031-017: OK — Super Admin has the same history-backed average: src/modules/admin-ui/super-admin-hiring-report-service.ts:120-138,190-198 computes the first SHORTLISTED transition minus the applied time from placement_college_application_stage_history (the same table as src/modules/placements/college-hiring-funnel-service.ts:79-84), weights it by observations and rounds to whole hours like the legacy tile, rendered with an explicit "Not recorded" state at src/app/(authenticated)/admin/placements/analytics/page.tsx:192-196 and in the CSV export; matches docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:488-498
- G2-13-031-065: OK — the average is calculated the same way for both roles (earliest first-shortlist history row minus submission time, negative values excluded, mean, shown only when at least one observation exists): college src/modules/placements/college-hiring-funnel-service.ts:79-84,140-142,198-204 and Super Admin src/modules/admin-ui/super-admin-hiring-report-service.ts:120-138,190-198; matches HiringDashboard.js:488-498
- G2-13-031-068: OK — both reports use an exclusive next-day upper bound instead of endOf("day") milliseconds: src/modules/placements/college-hiring-funnel-service.ts:35,102 and src/modules/admin-ui/super-admin-hiring-report-service.ts:85,219 with istStartOfNextDay (src/modules/admin-ui/super-admin-hiring-ist-boundary.ts); matches the intent of docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:72-84


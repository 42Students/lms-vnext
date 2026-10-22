# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-18-013-008  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-009  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-029  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-030  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-038  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-18-013-044  (source: docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_8.md)
- [ ] G2-12-024-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-021-001  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)
- [ ] G2-13-021-016  (source: docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_5.md)

## Results

- G2-12-024-021: OK — vNext src/modules/log-alerts/manual-ops.ts:12-34 (requestedHours clamped to 1..336 with default 24, windowStart = now - hours, message header and "New error types in last Nh" count use exactly that evidence window; global log admin only, send throttled) matches docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:222-235 (bounded = min(24*14, max(1, hours))).
- G2-13-021-001: OK — vNext src/modules/placements/screening-service.ts:41-60 (PLACEMENT_SCREENING_PROVENANCE: automaticScoringEnabled false, automatedStatus NOT_RUN, score fields null, mode MANUAL_REVIEW, immutableAlgorithmProvenance LEGACY_NOT_IMPORTED) is the explicit, documented sunset of numeric auto-matching in favour of a human screening decision, one persisted screening row per application (placementApplicationScreenings), matching the one-per-application record of docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:13-20 without fabricating scores.
- G2-13-021-016: OK — vNext src/modules/placements/screening-service.ts:45,55,184,320,355-363,484 (screeningVersion is the explicit model version "human-v1", distinct from legacy "v1"; screenedAt stays null because no automated run happened; decidedAt records the human decision instant) resolves ApplicationScreening.java:108-116 (screeningVersion default v1, screenedAt generated at insert) by giving each timestamp one honest meaning.
- G2-18-013-008: OK — vNext src/app/(authenticated)/learn/my-placements/jobs/page.tsx:15-48 (toItem adapter: id, title, description, responsibilities, job type label, employment type/locations, openings, min/max CTC as nullable numbers, application deadline and publishedAt as ISO strings or null, target program/department names) with company name/logo from learner-job-service.ts:107-114 and target labels at learner-job-service.ts:244-275 matches JobSearchDTO.java:19-38 / JobSearchCache.java:188-207; organization/college ids are intentionally not exposed to the learner and the active flag is implied by published-only.
- G2-18-013-009: FIXED — target program names are now limited to ACTIVE programs (legacy programCache excluded deleted NewProgram rows) and stay college-fenced through the department join, with department names from the program's department, in src/modules/placements/learner-job-service.ts; matches JobSearchCache.java:148-175.
- G2-18-013-022: OK — vNext src/modules/placements/learner-job-service.ts:163-186,195-200 (status PUBLISHED = legacy isActive and not draft, archivedAt null and legacyWasDeleted not true = not deleted, EXTERNAL_ONLY legacy visibility excluded, newest-created first) matches docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:42-74 (findAllActiveJobIds).
- G2-18-013-029: OK — vNext src/modules/placements/learner-jobs-browse-model.ts:19-30,157-180 (job type facet from jobTypeLabel/roleOption.employmentType, null or empty types skipped, counts per type; crosswalk category/jobType -> SCOPED_JOB_TYPE_FACET) over published, active rows only matches JobSearchCache.java:109-111,121-135.
- G2-18-013-030: FIXED — an empty drives feed caused by a missing or ambiguous academic enrollment was indistinguishable from "no open jobs" and backend read failures already show a distinct "not an empty jobs list" error; added getOwnLearnerJobEnrollmentState in src/modules/placements/learner-job-service.ts and an actionable "No placement drives can be shown yet" explanation in src/app/(authenticated)/learn/my-placements/jobs/page.tsx. Matches JobSearchCache.java:116-143 without swallowing errors.
- G2-18-013-038: OK — vNext has no in-process global cache: src/modules/placements/learner-job-service.ts:73-340 reads the authenticated learner's college-scoped, targeted published drives per request (DB indexes via placement_jobs college/status filters, bounded 100-id bulk reads, 500-id batches for names) and src/modules/placements/learner-jobs-browse-model.ts:19-30 records refresh as DB_READ_NO_GLOBAL_CACHE, so there is no cross-tenant cache to leak or warm; legacy startup load-all-and-partition at JobSearchCache.java:52-63,116-175 is deliberately not reproduced.
- G2-18-013-044: OK — vNext src/modules/placements/learner-job-service.ts:107-196,240-275 (joins: role options, company relationships and companies, the learner's own applications, eligibility policies, programs and departments for target names) replaces the Job/Department/NewProgram repositories and GenericSearchCache of JobSearchCache.java:6-11,36-50; with no cache, publish/unpublish/archive take effect on the next read and there is no refresh-on-publish step to maintain.

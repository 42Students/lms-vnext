# Work packet: edit src/db/schema/placements.ts (part 12 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u021-application-screening-entity.md, docs/audit/gap2/lane-5/u013-admin-job-service.md, docs/audit/gap2/lane-5/u015-job-application-status-history-repository.md

## G2-13-021-019  [P1] GAP  facet F07  effort M
- Legacy: Legacy no defined criteria means overallScore null, never auto zero. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:208-223`
- vNext now: vNext no computed overallScore. `src/db/schema/placements.ts:1114-1166`
- Fix: If scoring restored, null when no dimensions evaluated.

## G2-13-021-020  [P1] GAP  facet F07  effort M
- Legacy: Legacy education score null if zero factors evaluated. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:110-127`
- vNext now: vNext no factor-level scores. `src/db/schema/placements.ts:1114-1166`
- Fix: Preserve no-data exemption and fairness explanation.

## G2-13-021-031  [P1] GAP  facet F12  effort M
- Legacy: Legacy status PENDING→COMPLETED/FAILED. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:31-38`
- vNext now: vNext PENDING→HOLD/SHORTLISTED/REJECTED, HOLD→final. `src/db/schema/placements.ts:1145-1163`
- Fix: Create independent auto screening and decision state machines.

## G2-13-021-032  [P1] GAP  facet F12  effort M
- Legacy: Legacy scores unit interval, skill/education defaults0; no JPA DB CHECK enforcing range. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:41-58`
- vNext now: vNext no numeric fields, strong manual status CHECK. `src/db/schema/placements.ts:1114-1166`
- Fix: Define 0<=score<=1 CHECK for restored auto results.

## G2-13-021-034  [P1] GAP  facet F12  effort M
- Legacy: Legacy overall average evaluated components; null when none. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ScreeningServiceImpl.java:127-219`
- vNext now: vNext statuses only; no comparable arithmetic. `src/db/schema/placements.ts:1114-1166`
- Fix: Document scoring denominator and all excluded reasons.

## G2-13-021-049  [P1] GAP  facet F22  effort M
- Legacy: Legacy MySQL application_screening int PK FK, double score, JSON skills/exclusions/metadata, version/method and timestamp. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:18-146`
- vNext now: vNext PG manual screening status/decision columns only. `src/db/schema/placements.ts:1114-1166`, `drizzle/0022_placements_p6a_screening.sql:1-27`
- Fix: Define separate auto_score table and migration if retaining old results.

## G2-5-013-009  [P1] GAP  facet F04  effort L
- Legacy: Legacy application row includes notes, rejection reason, assessmentURL, offer letter and screening score sidecars (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:65-128`)
- vNext now: vNext core placementApplications only ID/job/role/membership/channel/status/timestamps (`src/db/schema/placements.ts:973-1019`)
- Fix: Map supplemental detail from notes/screenings/offers/history instead of dropping fields

## G2-5-013-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy stage statuses APPLIED SHORTLISTED ASSESSMENT INTERVIEW OFFERED REJECTED HIRED (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:79-90`)
- vNext now: vNext core applications state SUBMITTED/WITHDRAWN with other stage tables (`src/db/schema/placements.ts:1043-1059`)
- Fix: Surface equivalent pipeline stage projection and transitions across normalized tables

## G2-5-013-024  [P1] GAP  facet F07  effort M
- Legacy: Legacy assessment URL must <=2048 chars and valid http(s) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1288-1294`)
- vNext now: vNext core applications no assessmentUrl field (`src/db/schema/placements.ts:973-1019`)
- Fix: Enforce URL length/protocol in specific assessment sidecar writer

## G2-5-013-038  [P1] GAP  facet F10  effort L
- Legacy: Legacy getEligibleLearners returns matching college Learner list for job targeting (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:55-57`)
- vNext now: vNext eligibility in placement job policies and application validation (`src/db/schema/placements.ts:840-918`)
- Fix: Provide authorized eligible-learner preview with old targeting rules

## G2-5-013-048  [P1] GAP  facet F10  effort M
- Legacy: Legacy attachOfferLetter sets offerLetterUrl on an application (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:128-130`)
- vNext now: vNext app core stores no offer letter URL (`src/db/schema/placements.ts:973-1019`)
- Fix: Use normalized offer letter record with preview/access controls

## G2-5-013-053  [P1] GAP  facet F10  effort L
- Legacy: Legacy getApplicationHistory returns status history ascending changedAt (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:159-166`)
- vNext now: vNext placementApplicationStatusHistory stores submitted/withdrawn changes only (`src/db/schema/placements.ts:1064-1109`)
- Fix: Combine normalized stage/offer/decision histories chronologically in detail timeline

## G2-5-013-059  [P1] GAP  facet F12  effort M
- Legacy: Legacy job list excludes EXTERNAL_ONLY visibility by default (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:161-181`)
- vNext now: vNext applicationMode can be INTERNAL/EXTERNAL, not same flag (`src/db/schema/placements.ts:506-509`)
- Fix: Preserve legacy hidden-external list policy with explicit mapping

## G2-5-013-085  [P1] GAP  facet F22  effort L
- Legacy: Legacy JobApplication contains mutable status enum string, score sidecars, notes, offer-letter URL, row version (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-128`)
- vNext now: vNext placementApplications stores SUBMITTED/WITHDRAWN and normalized ancillary tables (`src/db/schema/placements.ts:973-1059`)
- Fix: Map each legacy mutable field to normalized table and preserve history

## G2-5-013-086  [P1] GAP  facet F22  effort L
- Legacy: Legacy status history stores old/new status, changed_at/by and rejection reason (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:14-35`)
- vNext now: vNext placementApplicationStatusHistory handles SUBMITTED/WITHDRAWN with actorUserId/reason (`src/db/schema/placements.ts:1064-1109`)
- Fix: Build stage/history union and preserve old status transition audit columns

## G2-5-013-087  [P1] GAP  facet F22  effort M
- Legacy: Legacy fields importantDates and applicationDeadline must remain derived consistent (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:45-50`)
- vNext now: vNext deadline directly column not coupled to importantDates JSON (`src/db/schema/placements.ts:506-515`)
- Fix: Add derived consistency constraint/process for equivalent calendar deadlines

## G2-5-013-089  [P1] GAP  facet F23  effort L
- Legacy: Legacy service supports per-application ASSESSMENT URL and REJECTED reason directly (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:79-98`)
- vNext now: vNext immutable core application status SUBMITTED/WITHDRAWN and separate TPO stages (`src/db/schema/placements.ts:973-1059`)
- Fix: Do not silently drop old assessment/rejection flow; map every stage explicitly

## G2-5-015-007  [P1] GAP  facet F04  effort L
- Legacy: oldStatus varchar50 nullable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:22-23`
- vNext now: fromStatus varchar24 and only SUBMITTED/WITHDRAWN allowed `src/db/schema/placements.ts:1073-1074,1097-1099`
- Fix: Provide full stage-event mapping before porting old history values.

## G2-5-015-008  [P1] GAP  facet F04  effort L
- Legacy: newStatus varchar50 stores pipeline statuses including REJECTED/HIRED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- vNext now: toStatus only SUBMITTED/WITHDRAWN in status history `src/db/schema/placements.ts:1100-1108`
- Fix: Build a unified timeline from college stages, screening, rounds, offers, joining.

## G2-5-015-019  [P1] GAP  facet F07  effort M
- Legacy: Recorder skips absent ID/status or same status case-insensitively `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-36`
- vNext now: DB transition check rejects unsupported or no-op transitions `src/db/schema/placements.ts:1097-1108`
- Fix: Normalize duplicate calls before insert and return structured invalid transition errors.

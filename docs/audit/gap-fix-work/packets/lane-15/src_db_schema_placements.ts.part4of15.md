# Work packet: edit src/db/schema/placements.ts (part 4 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-offer.md, docs/audit/gap2/lane-14/u010-job-application-source-validator.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-14/u015-job-lifecycle-status.md

## G2-13-015-033  [P1] GAP  facet F11  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:49-75` createdByType TPO or recruiter actor, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:99` verifierFacultyId distinct
- vNext now: `src/db/schema/placements.ts:1564-1567` single issuedByUserId, no verifiedBy source field
- Fix: Record dual actor roles/verification evidence for delegated recruiter selection vs TPO release

## G2-13-015-039  [P1] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:370-397` expire RELEASED if respondBy passed; if application already answered correct to ACCEPTED/DECLINED
- vNext now: `src/modules/placements/tpo-drive-offer-register-model.ts:40-48` derives EXPIRED vs OPEN/DUE_SOON from timestamps on ISSUED offers, `src/db/schema/placements.ts:1614-1617` EXPIRED status
- Fix: Ensure durable expiry sweep transitions and reconciles previously answered offers, not just badge derivation

## G2-13-015-053  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:44-55` nullable money scale unspecified, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:52` ctcLpa BigDecimal
- vNext now: `src/db/schema/placements.ts:1541` annualCtcInr integer, fixed/variable/bonus numeric(10,2)
- Fix: Define rounding/truncation policy and overflow handling for legacy fractional LPA salary

## G2-13-015-055  [P1] GAP  facet F20  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:296-318` reverse accepted returns status RELEASED and extends response48h
- vNext now: `src/db/schema/placements.ts:1614-1617` no RELEASED state, can return ISSUED if reversal supported
- Fix: Define reversal mapping to ISSUED with new expiry and restore withdrawn sibling application/offer history

## G2-13-015-058  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:29-118` complete job_offer entity has nullable createdById/verifiedBy/releasedAt/joiningStatus, status SELECTED default
- vNext now: `src/db/schema/placements.ts:1522-1595` placement_offers lacks selected/verifier/creator-type/releasedAt and joining inline fields
- Fix: Create explicit data-model crosswalk with legitimate separate evidence entities; no silent data loss on import

## G2-13-015-059  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:116-118` @Version concurrency token independent of offer count
- vNext now: `src/db/schema/placements.ts:1531` integer version issuance revision, `src/db/schema/placements.ts:1597-1602` unique application/version
- Fix: Maintain two distinct semantics: legacy entity revision versus vNext offer version ordinal

## G2-14-010-044  [P1] GAP  facet F22  effort M
- Legacy: Legacy defaults malformed source to EXTERNAL `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationSourceValidator.java:32-47`
- vNext now: New channel column has no DB default `src/db/schema/placements.ts:973-993`
- Fix: Set explicit import fallback and never depend on DB default

## G2-14-011-010  [P1] GAP  facet F04  effort L
- Legacy: Application shows source appliedAt notes rejection resume and score `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-127`
- vNext now: New channel submittedAt eligibility and normalized screening/offer history `src/db/schema/placements.ts:973-1114` `src/modules/placements/tpo-applicant-pipeline-service.ts:127-163`
- Fix: Build complete legacy-compatible application projection

## G2-14-011-012  [P1] GAP  facet F04  effort L
- Legacy: Eight legacy applicant pipeline labels include WAITLISTED and HIRED `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:44-46`
- vNext now: New separates SUBMITTED/WITHDRAWN, screening, round, offers, joining `src/db/schema/placements.ts:973-1060` `src/modules/placements/college-application-stage-service.ts:73-90`
- Fix: Document exact combined stage crosswalk

## G2-14-011-022  [P1] GAP  facet F06  effort M
- Legacy: EXTERNAL_ONLY clears and rejects targeting fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:340-347` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:532-557`
- vNext now: New external-only works with eligibility policy model `src/db/schema/placements.ts:818-921` `src/modules/placements/job-service.ts:202-233`
- Fix: Define external targeting semantics and missing target fields

## G2-14-011-044  [P1] GAP  facet F10  effort L
- Legacy: Legacy HIRED withdraws or rejects other active applications `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1286-1346`
- vNext now: New separate offer/joining status tables `src/db/schema/placements.ts:1522-1690`
- Fix: Ensure cross-drive hiring cascade and lock ordering

## G2-14-011-078  [P1] GAP  facet F22  effort L
- Legacy: Legacy Job fields include free CTC location targeting importantDates and flags `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:31-130` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:269-308`
- vNext now: New placementJobs normalizes status/season/location/CTC/company relationships `src/db/schema/placements.ts:462-625`
- Fix: Write complete legacy column disposition and migration map

## G2-14-011-079  [P1] GAP  facet F22  effort L
- Legacy: Legacy JobApplication unique job and learner with source notes resume reason offer and version `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-175`
- vNext now: New role option membership unique and channel with separated histories `src/db/schema/placements.ts:973-1114`
- Fix: Map all legacy columns to new tables and version semantics

## G2-14-011-080  [P1] GAP  facet F22  effort L
- Legacy: Legacy 8-stage app statuses `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:44-46`
- vNext now: New application status SUBMITTED WITHDRAWN only; separate screening and offer `src/db/schema/placements.ts:973-1060`
- Fix: Map composite status and all historical transitions

## G2-14-011-081  [P1] GAP  facet F22  effort L
- Legacy: Legacy Job and application contain screening/assessment references `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:212-268` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:65-115`
- vNext now: New normalized role options screening rounds offers `src/db/schema/placements.ts:625-735` `src/db/schema/placements.ts:1114-1690`
- Fix: Reconcile FK/multiplicity and missing record fields

## G2-14-015-003  [P1] GAP  facet F02  effort M
- Legacy: Legacy seven string states share same Job.lifecycleStatus `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:10-16` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:282-291`
- vNext now: New job lifecycle is five DB states, with request flow separate `src/db/schema/placements.ts:513-518` `src/db/schema/placements.ts:566-568`
- Fix: Document exact status projection and state-ownership split

## G2-14-015-004  [P1] GAP  facet F02  effort M
- Legacy: Legacy DRAFT_LIKE grouping contains REQUEST SENT_BACK REJECTED DRAFT `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-19`
- vNext now: New only DRAFT in job lifecycle plus other request storage `src/db/schema/placements.ts:613-618`
- Fix: Provide state mapping for draft-like visibility in list and API

## G2-14-015-008  [P1] GAP  facet F04  effort M
- Legacy: Legacy isDraft and isActive flags coupled to status `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:38-55`
- vNext now: New lifecycle check uses timestamps without those flags `src/db/schema/placements.ts:612-618`
- Fix: Derive compatibility isDraft/isActive from status, including archived

## G2-14-015-022  [P1] GAP  facet F10  effort M
- Legacy: Legacy SENT_BACK to REQUEST/CANCELLED allowed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:24-26`
- vNext now: New job lifecycle excludes SENT_BACK `src/db/schema/placements.ts:566-568`
- Fix: Document resubmit path and state crosswalk

## G2-14-015-028  [P1] GAP  facet F12  effort M
- Legacy: Legacy DRAFT_LIKE REQUEST SENT_BACK REJECTED DRAFT `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-19`
- vNext now: New DRAFT only before publish `src/db/schema/placements.ts:613-618`
- Fix: Represent non-live request workflow without leaking learner visibility

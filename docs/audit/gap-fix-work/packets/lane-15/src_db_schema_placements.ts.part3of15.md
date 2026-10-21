# Work packet: edit src/db/schema/placements.ts (part 3 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md, docs/audit/gap2/lane-13/job-application-search-cache.md, docs/audit/gap2/lane-13/job-application-status-validator.md, docs/audit/gap2/lane-13/job-offer.md

## G2-16-031-061  [P1] GAP  facet F22  effort L
- Legacy: TpoApplicantController.java:40-114 uses JobApplication id/status/actor
- vNext now: src/db/schema/placements.ts:973-1220 applications, screening/history tables
- Fix: Map status histories and composite job/learner uniqueness, explicit ownership for per-drive writes

## G2-16-031-062  [P1] GAP  facet F22  effort L
- Legacy: TpoResultsController.java:46-71 uses RoundResult staged/applied
- vNext now: src/db/schema/placements.ts:1222-1454 rounds/events/results with applied actor
- Fix: Check unique round+application result, waitlist rank, nullable score, timestamps and applied guard

## G2-16-031-063  [P1] GAP  facet F22  effort L
- Legacy: TpoOfferController.java:47-127 uses JobOffer selection/letter/response/joining
- vNext now: src/db/schema/placements.ts:1522-1690 offers/status history and 1880-1970 joining history
- Fix: Compare LOI/offer status enums, uniqueness, letter URL retention and separate joining outcome timestamps

## G2-13-014-028  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationRepository.java:111-113` eager FETCH learner+job, excludes isDeleted false
- vNext now: `src/modules/placements/tpo-applicant-pipeline-service.ts:95-158` innerJoin membership/job/role; no soft-delete column on `src/db/schema/placements.ts:973-1019`
- Fix: Map old is_deleted and withdrawn semantics to vNext application state and import filters

## G2-13-014-056  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-35` int id, learner_id,job_id,application_status/organizationId/appliedAt/is_deleted from BaseModel
- vNext now: `src/db/schema/placements.ts:973-1019` UUID id, jobId, roleOptionId,membershipId, channel,status SUBMITTED/WITHDRAWN, eligibility JSON, audit times
- Fix: Create migration crosswalk for legacy learner/job/application IDs and organization derivation, retain status history

## G2-13-014-057  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30` legacy lifecycle APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/REJECTED/HIRED
- vNext now: `src/db/schema/placements.ts:1048-1059` vNext application status check SUBMITTED/WITHDRAWN; `src/modules/placements/tpo-applicant-pipeline-service.ts:68-77` screening derived stages
- Fix: Map all legacy business states to round/screening/offer entities for search results and counts

## G2-13-014-059  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:67-70` partition by organization_id, no DB index itself
- vNext now: `src/db/schema/placements.ts:1033-1042` indexes per job/membership/status, no direct organizationId column
- Fix: Define org-wide join/index strategy before recreating legacy cross-job organization search

## G2-13-010-006  [P1] GAP  facet F03  effort L
- Legacy: Legacy statuses have APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/WAITLISTED/HIRED/REJECTED/WITHDRAWN labels (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:18-57`)
- vNext now: New app base status only SUBMITTED/WITHDRAWN, display stage has eight values excluding WITHDRAWN (`src/db/schema/placements.ts:993-1050`)
- Fix: Crosswalk stage/source for every label and withdrawn indicator.

## G2-13-010-055  [P1] GAP  facet F20  effort L
- Legacy: Old WITHDRAWN terminal in status map but reapply workaround exists (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:45-50`)
- vNext now: New WITHDRAWN has separate application lifecycle, no stage row direct (`src/db/schema/placements.ts:1047-1059`)
- Fix: Audit reapply gate and withdrawnAt nulling under optimistic concurrency.

## G2-13-010-058  [P1] GAP  facet F22  effort L
- Legacy: Old status stored on JobApplication.applicationStatus as coarse enum (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:56-65`)
- vNext now: New placementApplications.status SUBMITTED/WITHDRAWN + separate stages (`src/db/schema/placements.ts:973-1050`)
- Fix: Write 9-stage→status+screening+stage+offer joined migration crosswalk.

## G2-13-010-059  [P1] GAP  facet F22  effort L
- Legacy: Old JobApplicationStatusHistory stores each stage move with actor/message (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:63-76`)
- vNext now: New placementApplicationStatusHistory supports only SUBMITTED/WITHDRAWN; separate college stage history (`src/db/schema/placements.ts:1064-1103`)
- Fix: Ensure stage history rows and learner-visible messages preserved after migration.

## G2-13-015-001  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:18-29`,35-40 offer record is separated from job_application.status; initial SELECTED before verified RELEASED
- vNext now: `src/db/schema/placements.ts:1522-1535` stores versioned offer with initial status ISSUED, `src/modules/placements/offer-service.ts:267-297` issue flow
- Fix: Introduce explicitly persisted pre-release selection/verification decision or map legacy SELECTED accurately to separate vNext selection table

## G2-13-015-002  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:69-71` eight business states SELECTED,PENDING_VERIFICATION,RELEASED,ACCEPTED,DECLINED,EXPIRED,WITHDRAWN,REVOKED
- vNext now: `src/db/schema/placements.ts:1614-1617` five status values ISSUED,ACCEPTED,DECLINED,WITHDRAWN,EXPIRED
- Fix: Document status crosswalk and implement UI/workflow parity for pending verification and revoked states

## G2-13-015-007  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:31-36` Long id and Integer applicationId foreign logical reference
- vNext now: `src/db/schema/placements.ts:1525-1530` UUID id, applicationId FK to placementApplications
- Fix: Produce legacy-to-vNext offer ID crosswalk and guarantee dependent application links rekey correctly

## G2-13-015-008  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:42-49` roleOptionName nullable; ctcLpa/fixedLpa as BigDecimal
- vNext now: `src/db/schema/placements.ts:1536-1546` roleTitle required, annualCtcInr integer and fixedLpa numeric(10,2)
- Fix: Convert BigDecimal lakh package to integer INR precisely; preserve null and independent breakdown

## G2-13-015-012  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:73-87` acceptance channel, 48-hour disputable timestamp, joiningStatus, cascadeId
- vNext now: `src/db/schema/placements.ts:1552-1556` channel/disputable/cascadeId, `src/modules/placements/tpo-joining-followup-service.ts:1-?` joining separate table
- Fix: Reconstruct joiningStatus as vNext joining outcome record and verify cascade identifiers/data retention

## G2-13-015-013  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:92-106` createdByType,createdById,verifiedBy,releasedAt,respondedAt
- vNext now: `src/db/schema/placements.ts:1564-1581` issuedByUserId,issuedAt,respondedByUserId,respondedAt,withdrawnBy
- Fix: Persist creator actor type, verifier ID and pre-release/release timestamps via linked audit/history entities

## G2-13-015-014  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:108-118` createdAt/updatedAt and @Version optimistic lock
- vNext now: `src/db/schema/placements.ts:1531` version is offer revision sequence; `src/db/schema/placements.ts:1590-1595` updatedAt, `src/db/schema/placements.ts:1569` issuedAt
- Fix: Separate source optimistic lock version from offer issuance revision and migrate original timestamps

## G2-13-015-028  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:98-165` release changes underlying legacy JobApplication to OFFERED
- vNext now: `src/db/schema/placements.ts:993-995` vNext application status restricted SUBMITTED/WITHDRAWN; `src/modules/placements/offer-service.ts:509-539` writes offer status history
- Fix: Translate OFFERED via offer table status/history not application status; ensure learner Offers discoverability

## G2-13-015-030  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:199-252` EXTERNAL_IMPORT accepted with 48h dispute and scheduled finalization
- vNext now: `src/db/schema/placements.ts:1552-1555` stores channel/disputableUntil; `src/modules/placements/tpo-offer-lifecycle-model.ts:9-36` RECORD_ACCEPTED action
- Fix: Verify/complete external-import acceptance dispute creation/closure and scheduled cascade handler

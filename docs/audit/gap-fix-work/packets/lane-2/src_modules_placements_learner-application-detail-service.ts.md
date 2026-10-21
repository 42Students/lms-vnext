# Work packet: edit src/modules/placements/learner-application-detail-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/job-application.md, docs/audit/gap2/lane-8/job-application-status-history.md, docs/audit/gap2/lane-11/l18-u023-learner-eligibility-controller.md

## G2-12-019-006  [P1] GAP  facet F03  effort M
- Legacy: Old company/publicRef as stable applicant identifier `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:143-149,177-188`
- vNext now: New display uses application UUID, companySharePreview application ID same UUID `src/modules/placements/learner-application-detail-service.ts:172-179`
- Fix: Provide stable nonsequential company-facing ID, preserve legacy public refs.

## G2-12-019-039  [P1] GAP  facet F11  effort S
- Legacy: Legacy external/public identifiers stable without exposing int id `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:143-149,177-188`
- vNext now: New company share uses UUID internal applicationId as visible field `src/modules/placements/learner-application-detail-service.ts:172-179`
- Fix: Use publicRef to avoid disclosing internal key as candidate ID.

## G2-12-019-060  [P1] GAP  facet F23  effort M
- Legacy: Old per-job uniqueness and publicRef for company ATS `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-15,143-149,177-188`
- vNext now: New per-role uniqueness and UUID disclosure in company share `src/db/schema/placements.ts:1029-1035` `src/modules/placements/learner-application-detail-service.ts:172-179`
- Fix: Preserve external ATS identity and duplication guarantees.

## G2-8-019-026  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:60-77 synthetic baseline if no history exists
- vNext now: src/modules/placements/learner-application-detail-service.ts:102-128 no fallback, returns []
- Fix: Generate accurate initial event for legacy applications with no status-history rows.

## G2-18-023-018  [P2] MISSING  facet F07  effort S
- Legacy: Company preview nonapplicant throws `Apply to this drive to see this preview` with 404; LearnerEligibilityController.java:131-137
- vNext now: No applicant preview route/UI established; learner-application-detail-service.ts and job detail need check
- Fix: Restore exact gated error state with applications link, not a blank preview.

## G2-12-019-032  [P2] GAP  facet F08  effort S
- Legacy: Old publicRef starts 'A'+10 uppercase hex digits `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:181-188`
- vNext now: New UUID plain display `src/modules/placements/learner-application-detail-service.ts:172-179`
- Fix: Display stable applicant reference code for external sharing.

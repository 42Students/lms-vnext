# Work packet: edit src/db/schema/placements.ts (part 2 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/job-application.md, docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md

## G2-12-019-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy source VARCHAR50 supports INTERNAL,LINKEDIN,DIRECT_LINK etc `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:48-53`
- vNext now: New channel CHECK only INTERNAL/EXTERNAL `src/db/schema/placements.ts:992,1043-1046`
- Fix: Preserve granular source/provider provenance separately from channel.

## G2-12-019-012  [P1] MISSING  facet F04  effort M
- Legacy: Legacy papRequested boolean default false `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:55-60`
- vNext now: New placementApplications lacks PAP field `src/db/schema/placements.ts:973-1020`
- Fix: Add requested-assistance flag or map to participation registration explicitly.

## G2-12-019-014  [P1] MISSING  facet F04  effort M
- Legacy: Legacy assessmentUrl per application overrides job-level assessment `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:68-74`
- vNext now: New core has no assessmentUrl field `src/db/schema/placements.ts:973-1020`
- Fix: Preserve candidate-specific assessment link in separate secured table.

## G2-12-019-017  [P1] GAP  facet F04  effort M
- Legacy: Legacy withdrawalReason + statusBeforeWithdrawal VARCHAR30 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:98-102,162-164`
- vNext now: New stores WITHDRAWN and withdrawnAt, no original stage or reason in core `src/db/schema/placements.ts:993-1020`
- Fix: Store withdrawal reason and prior stage, preserve anti-reapply decision.

## G2-12-019-020  [P1] GAP  facet F04  effort M
- Legacy: Legacy @Version long optimistic token for application `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:127-133`
- vNext now: New core has updatedAt but not explicit integer version `src/db/schema/placements.ts:1015-1020`
- Fix: Require CAS/version for concurrent admin/TPO stage mutations and offer updates.

## G2-12-019-021  [P1] GAP  facet F04  effort M
- Legacy: Legacy currentRoundId FK reference and externalRef company portal ID `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:139-149`
- vNext now: New application row has no currentRoundId/externalRef; round/offer tables related separately `src/db/schema/placements.ts:973-1020,1399-1405`
- Fix: Preserve active round and external portal reference in applicant projection.

## G2-12-019-022  [P1] GAP  facet F04  effort L
- Legacy: Legacy appliedByCollege and optOutUntil, ineligibleFlagAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:166-175`
- vNext now: New core submittedByUserId/eligibilitySnapshot, no persisted opt-out/ineligible timestamp `src/db/schema/placements.ts:996-1020`
- Fix: Preserve staff-origin opt-out and ineligible flag history.

## G2-12-019-026  [P1] GAP  facet F06  effort L
- Legacy: Legacy resume upload distinct from profile resume, revision history `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:62-82`
- vNext now: New application submission service records membership and role, no core resume snapshot `src/modules/placements/application-service.ts:840-879` `src/db/schema/placements.ts:973-1020`
- Fix: Allow signed upload/selection per application with history, validate URL origin.

## G2-12-019-029  [P1] GAP  facet F07  effort M
- Legacy: Old @Version prevents stale writes with optimistic-lock error `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:127-133`
- vNext now: New application status row has no version, some staff stage models track separate version `src/db/schema/placements.ts:973-1020` `src/modules/placements/college-application-stage-service.ts:67-80`
- Fix: Use one canonical state/version gate when updating application and stage together.

## G2-12-019-040  [P1] GAP  facet F12  effort S
- Legacy: Legacy withdrawal keeps statusBeforeWithdrawal `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:98-102`
- vNext now: New WITHDRAWN stores withdrawnAt only; eligibility gate decides reapply using screening/offer facts `src/db/schema/placements.ts:993-1020` `src/modules/placements/application-service.ts:819-847`
- Fix: Persist prior application stage and review reapply behavior after advanced stage.

## G2-12-019-042  [P1] GAP  facet F12  effort S
- Legacy: Old @Version ensures concurrent update isolation `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:127-133`
- vNext now: New status history tracks SUBMITTED/WITHDRAWN only and no application CAS token `src/db/schema/placements.ts:1064-1109`
- Fix: Add CAS for applicant core state, avoid lost staff status updates.

## G2-12-019-046  [P1] MISSING  facet F14  effort S
- Legacy: Old resumeHistory JSON versions previous URL on reapply `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:76-82`
- vNext now: New no history, only status history for withdrawal/submission `src/db/schema/placements.ts:1064-1109`
- Fix: Store file/version audit when resume changed.

## G2-12-019-053  [P1] GAP  facet F20  effort L
- Legacy: Old optimistic-lock version on root application `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:127-133`
- vNext now: New concurrency token is updatedAt, no canonical CAS for stage+offer write `src/db/schema/placements.ts:1015-1020` `src/modules/placements/college-application-stage-service.ts:51-82`
- Fix: Introduce explicit version in state transitions and prove serializable edits.

## G2-12-019-054  [P1] MISSING  facet F20  effort M
- Legacy: Legacy publicRef assigned in @PrePersist even with null/blank `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:181-188`
- vNext now: New DB UUID created by default, no publicRef enforcement `src/db/schema/placements.ts:973-977`
- Fix: Add unique publicRef with backfill for existing applications.

## G2-12-019-056  [P1] GAP  facet F22  effort L
- Legacy: Old MySQL job_application INT PK, unique(learner_id,job_id), orgId, resume JSON, version, publicRef and 20+ fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-189`
- vNext now: New PG application UUID, role/member unique and 12 core columns; related stages/offers/history `src/db/schema/placements.ts:973-1109`
- Fix: Write complete field-level migration/disposition for each legacy column and relation.

## G2-12-019-059  [P1] GAP  facet F22  effort L
- Legacy: Legacy statusUpdatedAt/statusUpdatedBy and applicationStatus include interview/offer `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-46`
- vNext now: New history table only SUBMITTED/WITHDRAWN, other transitions in independent tables `src/db/schema/placements.ts:1064-1109,1114-1145`
- Fix: Build unified applicant stage timeline joining all status sources.

## G2-12-019-060  [P1] GAP  facet F23  effort M
- Legacy: Old per-job uniqueness and publicRef for company ATS `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-15,143-149,177-188`
- vNext now: New per-role uniqueness and UUID disclosure in company share `src/db/schema/placements.ts:1029-1035` `src/modules/placements/learner-application-detail-service.ts:172-179`
- Fix: Preserve external ATS identity and duplication guarantees.

## G2-16-031-040  [P1] GAP  facet F12  effort M
- Legacy: TpoOfferController.java:118-127 joining-status/reverse acceptance independent operations
- vNext now: src/db/schema/placements.ts:1880-1970 joining outcomes and history
- Fix: Prove joining is separate from offer acceptance, with reversible status and dated history; do not infer joined from accepted

## G2-16-031-059  [P1] GAP  facet F22  effort L
- Legacy: TpoCompanyController.java:47-105 uses Company and domain trust relations
- vNext now: src/db/schema/placements.ts:23-124 companies and relationships; placement-company-identities.ts identities
- Fix: Check global company identity vs college relationships and trusted-domain constraints; avoid cross-tenant duplicate merging

## G2-16-031-060  [P1] GAP  facet F22  effort L
- Legacy: TpoDriveController.java:51-185 owned Job drives lifecycle
- vNext now: src/db/schema/placements.ts:374-624 seasons, jobs, scoped FKs
- Fix: Map legacy Job columns/status to placement_jobs/season/company relationship fields; verify every applied migration

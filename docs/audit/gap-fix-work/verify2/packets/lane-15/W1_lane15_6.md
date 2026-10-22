# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-010-109 [P1] GAP facet F23
- Files: src/components/placements/placement-drive-workspace.tsx
- Legacy: Old retention of stale data plus sectional Retry. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:442`
- Expected fix: Provide unified retriable partial-data states.

## G2-12-019-001 [P1] GAP facet F01
- Files: src/db/schema/placements.ts
- Legacy: JobApplication is single learner+job application, all stage/offer metadata embedded `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-30,135-171`
- Expected fix: Define old one-job application to new per-role applications mapping, prevent duplicate company submissions.

## G2-12-019-005 [P1] GAP facet F03
- Files: src/db/schema/placements.ts, src/modules/placements/college-application-stage-service.ts
- Legacy: Legacy string status APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/REJECTED/HIRED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- Expected fix: Map each old status to canonical pipeline stage in every list, badge and notification.

## G2-12-019-007 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy learner FK and job FK required, unique learner+job `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-27`
- Expected fix: Decide if multiple role applications in same job allowed; preserve one-per-job policy if required.

## G2-12-019-011 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy source VARCHAR50 supports INTERNAL,LINKEDIN,DIRECT_LINK etc `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:48-53`
- Expected fix: Preserve granular source/provider provenance separately from channel.

## G2-12-019-012 [P1] MISSING facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy papRequested boolean default false `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:55-60`
- Expected fix: Add requested-assistance flag or map to participation registration explicitly.

## G2-12-019-014 [P1] MISSING facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy assessmentUrl per application overrides job-level assessment `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:68-74`
- Expected fix: Preserve candidate-specific assessment link in separate secured table.

## G2-12-019-017 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy withdrawalReason + statusBeforeWithdrawal VARCHAR30 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:98-102,162-164`
- Expected fix: Store withdrawal reason and prior stage, preserve anti-reapply decision.

## G2-12-019-020 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy @Version long optimistic token for application `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:127-133`
- Expected fix: Require CAS/version for concurrent admin/TPO stage mutations and offer updates.

## G2-12-019-021 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy currentRoundId FK reference and externalRef company portal ID `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:139-149`
- Expected fix: Preserve active round and external portal reference in applicant projection.

## G2-12-019-022 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy appliedByCollege and optOutUntil, ineligibleFlagAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:166-175`
- Expected fix: Preserve staff-origin opt-out and ineligible flag history.

## G2-12-019-029 [P1] GAP facet F07
- Files: src/db/schema/placements.ts, src/modules/placements/college-application-stage-service.ts
- Legacy: Old @Version prevents stale writes with optimistic-lock error `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:127-133`
- Expected fix: Use one canonical state/version gate when updating application and stage together.

## G2-12-019-040 [P1] GAP facet F12
- Files: src/db/schema/placements.ts, src/modules/placements/application-service.ts
- Legacy: Legacy withdrawal keeps statusBeforeWithdrawal `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:98-102`
- Expected fix: Persist prior application stage and review reapply behavior after advanced stage.

## G2-12-019-042 [P1] GAP facet F12
- Files: src/db/schema/placements.ts
- Legacy: Old @Version ensures concurrent update isolation `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:127-133`
- Expected fix: Add CAS for applicant core state, avoid lost staff status updates.

## G2-12-019-046 [P1] MISSING facet F14
- Files: src/db/schema/placements.ts
- Legacy: Old resumeHistory JSON versions previous URL on reapply `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:76-82`
- Expected fix: Store file/version audit when resume changed.

## G2-12-019-054 [P1] MISSING facet F20
- Files: src/db/schema/placements.ts
- Legacy: Legacy publicRef assigned in @PrePersist even with null/blank `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:181-188`
- Expected fix: Add unique publicRef with backfill for existing applications.

## G2-12-019-056 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Old MySQL job_application INT PK, unique(learner_id,job_id), orgId, resume JSON, version, publicRef and 20+ fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-189`
- Expected fix: Write complete field-level migration/disposition for each legacy column and relation.

## G2-12-019-059 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy statusUpdatedAt/statusUpdatedBy and applicationStatus include interview/offer `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-46`
- Expected fix: Build unified applicant stage timeline joining all status sources.

## G2-12-019-060 [P1] GAP facet F23
- Files: src/db/schema/placements.ts, src/modules/placements/learner-application-detail-service.ts
- Legacy: Old per-job uniqueness and publicRef for company ATS `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-15,143-149,177-188`
- Expected fix: Preserve external ATS identity and duplication guarantees.

## G2-16-031-040 [P1] GAP facet F12
- Files: src/db/schema/placements.ts
- Legacy: TpoOfferController.java:118-127 joining-status/reverse acceptance independent operations
- Expected fix: Prove joining is separate from offer acceptance, with reversible status and dated history; do not infer joined from accepted

## G2-16-031-059 [P1] GAP facet F22
- Files: src/db/schema/placements.ts, src/db/schema/placement-company-identities.ts
- Legacy: TpoCompanyController.java:47-105 uses Company and domain trust relations
- Expected fix: Check global company identity vs college relationships and trusted-domain constraints; avoid cross-tenant duplicate merging

## G2-16-031-060 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: TpoDriveController.java:51-185 owned Job drives lifecycle
- Expected fix: Map legacy Job columns/status to placement_jobs/season/company relationship fields; verify every applied migration

## G2-16-031-061 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: TpoApplicantController.java:40-114 uses JobApplication id/status/actor
- Expected fix: Map status histories and composite job/learner uniqueness, explicit ownership for per-drive writes

## G2-16-031-062 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: TpoResultsController.java:46-71 uses RoundResult staged/applied
- Expected fix: Check unique round+application result, waitlist rank, nullable score, timestamps and applied guard

## G2-17-029-058 [P1] GAP facet F22
- Files: src/db/schema/platform-setting-overrides.ts
- Legacy: legacy TenantAdminController.java:637-762 app_setting keyed by scopeType, numeric scopeId and key, deletes rows to default
- Expected fix: Document schema translation, org dropped, custom stored keys, migration 0119 existence, no data migration but settings effectiveness

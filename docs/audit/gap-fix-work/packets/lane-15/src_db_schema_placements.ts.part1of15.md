# Work packet: edit src/db/schema/placements.ts (part 1 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l15-u022-tpo-recruiter-access-controller.md, docs/audit/gap2/lane-3/job-types.md, docs/audit/gap2/lane-1/l15-u019-industry-company.md, docs/audit/gap2/lane-1/learner-placement-profile-controller.md, docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-12/company-domain.md

## G2-15-022-032  [P0] GAP  facet F12  effort M
- Legacy: Legacy `STATUS_ACTIVE` with `validUntil==null` considered live; RecruiterCollegeAccess.java:26-27,76-83
- vNext now: vNext NULL invalid/fail-closed (`ended` true); tpo-recruiter-access-model.ts:126-127; placements.ts `placement_recruiter_college_grants.valid_until`
- Fix: Decide conflict between legacy indefinite access and new fail-closed policy; never silently treat null as both.

## G2-3-011-034  [P0] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:108-114`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:392-397`
- vNext now: `src/db/schema/placements.ts:496-498`, `570-573`, `src/modules/placements/report-service.ts:159-163`
- Fix: Legacy job.counts_as_placed is source of eligibility, held-offer and reports; vNext jobs store only three-value employmentType, no count flag, reports ignore type-specific placed answer. Restore per-drive placed policy.

## G2-15-019-007  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:41-44 — nullable Long @Version optimistic lock
- vNext now: src/db/schema/placements.ts:47-56 — updatedAt only, no version integer
- Fix: Add CAS/version for shared company updates

## G2-15-019-014  [P1] GAP  facet F09  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:41-44 — JPA @Version protects concurrent edits
- vNext now: src/db/schema/placements.ts:23-57 — no numeric version on company
- Fix: Document compare-and-swap update token

## G2-15-019-028  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:41-44 — JPA optimistic @Version on entity
- vNext now: src/db/schema/placements.ts:23-57 — no version, updatedAt only
- Fix: Enforce conditional mutations and stale edit conflict

## G2-1-009-009  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:34-35`: tenthPct BigDecimal.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: not present; `src/db/schema/placements.ts:749-749`: tenthPctBasisPoints available elsewhere.
- Fix: Read verified 10th percent, convert basis points to percentage, label source.

## G2-1-009-010  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:37-38`: twelfthPct BigDecimal.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: absent; `src/db/schema/placements.ts:750`: twelfthPctBasisPoints stored.
- Fix: Read verified 12th percent and format percent accurately.

## G2-1-009-011  [P1] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:40-41`: diplomaPct BigDecimal.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: absent; `src/db/schema/placements.ts:751`: diplomaPctBasisPoints stored.
- Fix: Add diploma percentage and absence placeholder.

## G2-1-009-055  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:19-70`: learner_academic_record keyed integer learner_id with cgpa/percent/gap/source/import metadata.
- vNext now: `src/db/schema/placements.ts:738-800`: placementCandidateAcademicEvidence stores numeric evidence by other membership+job context.
- Fix: Map all 13 legacy columns into canonical per-member evidence or snapshot; add provenance and indexes.

## G2-10-004-019  [P1] GAP  facet F04  effort L
- Legacy: Legacy duplicate company names permitted after domain-global V202 migration `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19`
- vNext now: New placement_companies lower(name) unique across platform `src/db/schema/placements.ts:59-64`
- Fix: Allow distinct real companies with same name but distinct verified domains; move unique identity to domain

## G2-10-004-081  [P1] GAP  facet F19  effort L
- Legacy: Old global companies with same name but different domain both listed distinct IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-15`
- vNext now: New query joins and repeats one company on multiple colleges, and schema enforces unique lower(name) `src/modules/placements/admin-company-directory-service.ts:68-112` `src/db/schema/placements.ts:59-64`
- Fix: Redesign distinct identity listing independent of relationship rows

## G2-10-004-087  [P1] GAP  facet F22  effort L
- Legacy: Legacy V202 one shared company, domains unique per domain, college_company has private notes contacts & owner `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:21-60`
- vNext now: New placement_companies and placement_company_relationships include trust owner and status; no private contact/notes columns on relationship `src/db/schema/placements.ts:23-155`
- Fix: Add permissioned college CRM contact/notes model or record deliberate data feature removal

## G2-10-004-088  [P1] GAP  facet F22  effort L
- Legacy: Legacy V202 allows same company name for distinct global identities by domain `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:30-42`
- vNext now: New lower(name) unique, primaryDomain unique if non-null `src/db/schema/placements.ts:59-65`
- Fix: Remove name-global uniqueness and enforce canonical identity/domain rules

## G2-15-022-047  [P1] GAP  facet F22  effort M
- Legacy: Legacy entity has recruiter/college/org IDs, status, grant/valid/revoke dates, reason, capability set, version; RecruiterCollegeAccess.java:24-77
- vNext now: vNext placementRecruiterCollegeGrants uses UUID recruiterUserId + companyRelationshipId, capabilities, verification, reason, timestamps; placements.ts:201-287
- Fix: Create column parity crosswalk: legacy revokedByType/grantedByType/version versus vNext updatedAt CAS; note source/join provenance.

## G2-12-020-005  [P1] MISSING  facet F03  effort M
- Legacy: Legacy verifiedBy42 boolean indicates domain individually verified `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- vNext now: New child domain row no verifier/verified flag; company-level verifiedAt applies entire company `src/db/schema/placement-company-identities.ts:6-15` `src/db/schema/placements.ts:35-37`
- Fix: Persist domain-level verification state independently of company verification.

## G2-12-020-020  [P1] MISSING  facet F06  effort S
- Legacy: Old verifiedBy42 false by default, only verified action should set true `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- vNext now: New has no field; company.verifiedAt separate `src/db/schema/placement-company-identities.ts:6-15` `src/db/schema/placements.ts:35-37`
- Fix: Require explicit domain verification workflow and display badge.

## G2-12-020-037  [P1] MISSING  facet F13  effort S
- Legacy: Legacy null verifiedBy42 impossible (nullable=false) default false `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- vNext now: New has no field and may infer parent verification `src/db/schema/placement-company-identities.ts:6-15` `src/db/schema/placements.ts:35-37`
- Fix: Backfill false for legacy unverified company domains.

## G2-12-019-001  [P1] GAP  facet F01  effort L
- Legacy: JobApplication is single learner+job application, all stage/offer metadata embedded `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-30,135-171`
- vNext now: New application per roleOptionId+membership, with screening/stage/offer separated tables `src/db/schema/placements.ts:973-1035,1114-1145`
- Fix: Define old one-job application to new per-role applications mapping, prevent duplicate company submissions.

## G2-12-019-005  [P1] GAP  facet F03  effort L
- Legacy: Legacy string status APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/REJECTED/HIRED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- vNext now: New status SUBMITTED/WITHDRAWN only; screening and college stages derive business stage `src/db/schema/placements.ts:993-995,1048-1059` `src/modules/placements/college-application-stage-service.ts:25-31`
- Fix: Map each old status to canonical pipeline stage in every list, badge and notification.

## G2-12-019-007  [P1] GAP  facet F04  effort M
- Legacy: Legacy learner FK and job FK required, unique learner+job `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-27`
- vNext now: New jobId/roleOptionId/membershipId, unique roleOption+member not job+member `src/db/schema/placements.ts:973-991,1029-1035`
- Fix: Decide if multiple role applications in same job allowed; preserve one-per-job policy if required.

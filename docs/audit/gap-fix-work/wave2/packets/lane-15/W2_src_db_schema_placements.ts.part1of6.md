# Work packet (wave 2): edit src/db/schema/placements.ts (part 1 of 6)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l15-u019-industry-company.md, docs/audit/gap2/lane-1/learner-placement-profile-controller.md, docs/audit/gap2/lane-10/superadmin-companies.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md, docs/audit/gap2/lane-12/company-domain.md

## G2-15-019-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:12-21 — industry_company shared across colleges
- vNext now: src/db/schema/placements.ts:23-25,75-86 — placement_companies global plus relationships
- Fix: Map historical identity, retire old source without replacing canonical company

## G2-15-019-004  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:23-24 — name mandatory VARCHAR150
- vNext now: src/db/schema/placements.ts:26-27,59-61 — TEXT not null, lower-name unique
- Fix: Align API length validation or approve expanded length

## G2-15-019-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:26-33 — website/logo max500, industry max100
- vNext now: src/db/schema/placements.ts:28-35 — website/logo TEXT; industry varchar160
- Fix: Document max length conversion and API validations

## G2-15-019-006  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:35-39 — integer createdByUserId and creator type VARCHAR20
- vNext now: src/db/schema/placements.ts:41-43 — UUID required creator, no type snapshot
- Fix: Map creator records and freeze historical role provenance

## G2-15-019-018  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37 — int ID, created/updated local timestamps, isDeleted false
- vNext now: src/db/schema/placements.ts:26,38-56 — UUID and timestamptz and status ACTIVE/ARCHIVED
- Fix: Explicit ID/time/status migration crosswalk

## G2-15-019-021  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:31-33 — logo_url URL string max500
- vNext now: src/db/schema/placements.ts:32-33 — logoObjectPath and logoPublicUrl
- Fix: Migrate URL to public asset or signed storage representation

## G2-15-019-031  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37 — int identity, isDeleted, local timestamps
- vNext now: src/db/schema/placements.ts:26,38-56 — UUID/status/tz timestamps
- Fix: Document no-migration vNext identity choice and import compatibility

## G2-15-019-032  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:23-44 — legacy lengths, creator provenance, version
- vNext now: src/db/schema/placements.ts:27-56 — different lengths, UUID creator, no version
- Fix: Provide column-by-column transformation checklist

## G2-1-009-013  [P2] MISSING  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:46-47`: gapYears Integer default 0.
- vNext now: `src/app/(authenticated)/learn/profile/academic-record/page.tsx:17-24`: gap-years absent; `src/db/schema/placements.ts:755`: separate gapYears column.
- Fix: Show gap years, distinguish unknown vs zero and source.

## G2-1-009-051  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:29-44`: BigDecimal percentages and CGPA persisted without JS float representation.
- vNext now: `src/db/schema/placements.ts:746-751`: integer hundredths/basis points for placement evidence.
- Fix: Convert integer basis points exactly; preserve fraction rounding and `0` vs null.

## G2-10-004-048  [P2] GAP  facet F10  effort M
- Legacy: Legacy global verify POST id/verify toggles verified and domain verified flag; invalidates search `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:53-56` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:67-76`
- vNext now: New POST /api/admin/companies/verification invoked for verified state; company verifiedAt field `src/components/admin/super-admin-company-verification.tsx:13-22` `src/db/schema/placements.ts:34-38`
- Fix: Check verification propagates across all domains and recruiter drive company matching

## G2-10-011-083  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:13-40,89-109 — job_application keyed by numeric ID with learner+job unique, status, notes, rejection and offer letter columns.
- vNext now: src/db/schema/placements.ts:850-1100; src/db/schema/placement-college-application-stages.ts:5-35 — Normalized UUID applications, stage/history tables and offers; non-identical field ownership.
- Fix: Create field-level mapping for all statuses/notes/offers and preserve unique learner/job constraints.

## G2-10-012-080  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:20-41,74-90,119-131 — Job table numeric ID with separate isDraft/isActive, applicationDeadline and organization/college.
- vNext now: src/db/schema/placements.ts:560-760; src/modules/placements/job-service.ts:73-83 — UUID job, single status enum, relationship/season normalization; no equivalent dual legacy flags.
- Fix: Provide explicit legacy job status mapping including expired independent of state.

## G2-12-020-001  [P2] GAP  facet F01  effort M
- Legacy: One company can have multiple domains; company_domain globally unique by domain `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-35`
- vNext now: New placementCompanyDomains child with global lower(domain) unique; primaryDomain duplicated on company `src/db/schema/placement-company-identities.ts:6-15` `src/db/schema/placements.ts:23-32`
- Fix: Keep child/global primary-domain synchronization and explicit source of truth.

## G2-12-020-045  [P2] GAP  facet F18  effort S
- Legacy: Legacy domain verification attribute named verifiedBy42 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:34-35`
- vNext now: New company-wide verifiedAt used, no row verification badge `src/db/schema/placements.ts:35-37` `src/db/schema/placement-company-identities.ts:6-15`
- Fix: Restore per-domain 'Verified by 42' badge copy/status.

## G2-12-019-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy model includes status, source, resume, scores, offer fields on one application `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-133`
- vNext now: New normalized application core holds channel, eligibility, submittedAt and withdrawal; metadata elsewhere `src/db/schema/placements.ts:973-1020`
- Fix: Project same field groupings from normalized relations into detail UI.

## G2-12-019-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy applicant row user/job unique and embedded offer letter URL `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-15,104-112`
- vNext now: New application role-member unique, offer letter in separate placementOffers `src/db/schema/placements.ts:1029-1035,1526-1608`
- Fix: Preserve applicant identity and offer-letter display via joins.

## G2-12-019-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy appliedAt immutable creation timestamp `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:35-37`
- vNext now: New submittedAt modifiable on withdrawal reapply `src/db/schema/placements.ts:1007-1011` `src/modules/placements/application-service.ts:840-846`
- Fix: Retain firstAppliedAt/history timestamps on reapplication.

## G2-12-019-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy statusUpdatedAt/statusUpdatedBy actor fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:39-46`
- vNext now: New updatedAt but actor on status history, no current status updatedBy core `src/db/schema/placements.ts:1015-1020,1064-1088`
- Fix: Project last actor/time using history and avoid exposing internal actors to learners.

## G2-12-019-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy rejectionReason VARCHAR500 student-facing `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:91-96`
- vNext now: New core no rejection reason, screening candidateMessage separate `src/db/schema/placements.ts:1114-1145` `src/modules/placements/college-application-stage-service.ts:141-149`
- Fix: Project candidate-facing reason, enforce 500 char equivalent.

## G2-12-019-018  [P2] GAP  facet F04  effort S
- Legacy: Legacy offerLetterUrl and offerLetterSentAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:104-112`
- vNext now: New offers separate with letter payload and status, not application core `src/db/schema/placements.ts:1526-1598`
- Fix: Expose issued offer letter with time through offer relation.

## G2-12-019-019  [P2] GAP  facet F04  effort S
- Legacy: Legacy screeningScore/isPartialScore @Transient `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:114-125`
- vNext now: New persisted screening status and eligibility snapshot, no transient numeric score on application row `src/db/schema/placements.ts:996-1001,1114-1145`
- Fix: Project fair score and partial-data flag from screening evaluation.

## G2-12-019-024  [P2] GAP  facet F05  effort S
- Legacy: Legacy uniqueness per learner+job `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-15`
- vNext now: New roles permit multiple roleOption applications for same job `src/db/schema/placements.ts:1029-1035`
- Fix: Make duplicate policy explicit in Apply CTA and API.

## G2-12-019-025  [P2] MISSING  facet F06  effort S
- Legacy: Legacy internal and external refs unrestricted strings in entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:143-149`
- vNext now: New role/member and UUID validators, no externalRef/publicRef input in current core `src/db/schema/placements.ts:973-1020`
- Fix: Restore company portal reference field with controlled max length.

## G2-12-019-027  [P2] MISSING  facet F06  effort S
- Legacy: Legacy PAP request defaults false `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:55-60`
- vNext now: New no papRequested request field in application core `src/db/schema/placements.ts:973-1020`
- Fix: Add PAP toggle or documented moved feature.

## G2-12-019-041  [P2] GAP  facet F12  effort S
- Legacy: Old ineligibleFlagAt preserves a flagged record, never deletes `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:173-175`
- vNext now: New eligibilitySnapshot immutable at submission but no subsequent ineligibleFlagAt `src/db/schema/placements.ts:996-1001`
- Fix: Track later eligibility reversal/flag timestamp.

## G2-12-019-043  [P2] GAP  facet F13  effort S
- Legacy: Legacy app may have nullable source/ref/resume/PAP false; still valid `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:48-82,143-175`
- vNext now: New role application requires eligibilitySnapshot/roleOptionId and channel `src/db/schema/placements.ts:982-1001`
- Fix: Define imported legacy fallback and error for missing role option.

## G2-12-019-044  [P2] GAP  facet F13  effort S
- Legacy: Old legacy screeningScore transient may be null `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:114-125`
- vNext now: New offer/stage read may omit score; expose honest 'Not scored' fallback `src/db/schema/placements.ts:996-1001,1114-1145`
- Fix: Distinguish missing vs zero score in admin view.

## G2-12-019-047  [P2] GAP  facet F15  effort S
- Legacy: Old application model has notification-linked assessmentUrl and offer letter sentAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:69-74,104-112`
- vNext now: New notice delivered from activity events and generic kind, no per-application assessment URL `src/modules/placements/learner-placement-event-delivery.ts:13-35` `src/db/schema/placements.ts:973-1020`
- Fix: Pass approved candidate-specific link and status transitions through notice payload.

## G2-12-019-050  [P2] GAP  facet F18  effort S
- Legacy: Old user-visible pipeline APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/REJECTED/HIRED `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- vNext now: New row status SUBMITTED and separate stages have differing names `src/modules/placements/college-application-stage-service.ts:25-31` `src/db/schema/placements.ts:993-995`
- Fix: Restore old stage wording and explanatory labels.

## G2-12-019-052  [P2] GAP  facet F19  effort M
- Legacy: Legacy unique learnerId/jobId and organizationId allow direct indexed access `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:12-15,21-33`
- vNext now: New role+membership unique and job/membership indexes plus status indexes `src/db/schema/placements.ts:1029-1042`
- Fix: Benchmark applicant retrieval by drive/learner with one-per-job semantics.

## G2-12-019-058  [P2] GAP  facet F22  effort M
- Legacy: Old soft deletion isDeleted inherited `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:36-37`
- vNext now: New application no deletedAt/isDeleted, status WITHDRAWN separate `src/db/schema/placements.ts:973-1020`
- Fix: Define archive/soft-delete migration and retention rules.

## G2-13-010-012  [P2] GAP  facet F04  effort M
- Legacy: Old current REJECTED with target APPLIED valid; WITHDRAWN terminal (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:42-50`)
- vNext now: New status WITHDRAWN lives outside stage map; withdrawn cannot stage move (`src/db/schema/placements.ts:1047-1059`)
- Fix: Maintain withdrawn terminal and reapply alternate flow only with prior-status gate.

## G2-13-010-061  [P2] GAP  facet F22  effort S
- Legacy: Old nullable status accepted only no-op impossible with null (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:67-71`)
- vNext now: New non-null status defaults SUBMITTED, stage derived when absent (`src/db/schema/placements.ts:993-996`)
- Fix: Repair migrated null stage to explicit initial stage; no untracked null workflow.

## G2-13-015-011  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:59-67` joiningDate nullable, respondBy deadline, letterUrl
- vNext now: `src/db/schema/placements.ts:1537-1540` offerLetterUrl plus attach metadata, `src/db/schema/placements.ts:1558-1563` joiningDate, expiresAt
- Fix: Map respondBy→expiresAt and letterUrl→offerLetterUrl, with null 'to be announced' display

## G2-13-015-015  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:14-16` first/latest offer ordered createdAt desc; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:18-23` all offers by job/learner
- vNext now: `src/db/schema/placements.ts:1597-1609` uniqueness by application/version, `src/modules/placements/tpo-drive-offer-register-model.ts:59` issuedAt descending
- Fix: Order latest by source created timestamp with version tie-breaker; ensure stable multi-version display

## G2-13-015-016  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:25-30` helper queries expired RELEASED and external accepted window complete
- vNext now: `src/modules/placements/offer-service.ts:705-715` action checks expiry; `src/db/schema/placements.ts:1553` expiresAt, pending sweeps in separate service
- Fix: Wire scheduled expiration and external-dispute finalization with explicit parity outcomes

## G2-13-015-037  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:273-275` WITHDRAWN notification and application transition to REJECTED
- vNext now: `src/modules/placements/offer-service.ts:1014-1070` status WITHDRAWN; `src/db/schema/placements.ts:1614-1617` no REJECTED offer status
- Fix: Specify application status after offer withdrawal and exact learner notification semantics

## G2-13-015-052  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:25-30` scans expired RELEASED/accepted external dispute by status/date
- vNext now: `src/db/schema/placements.ts:1608-1609` status index per application, no status+expiry composite index in reviewed schema
- Fix: Add expiry/status partial index if recurring sweeps become expensive across colleges

## G2-13-015-056  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:24-26` JPA MySQL job_offer table
- vNext now: `src/db/schema/placements.ts:1522-1670` Postgres placement_offers plus offer status history
- Fix: Specify migration table mapping, history versioning and legacy ID preservation

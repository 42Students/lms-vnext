# Work packet (wave 3): edit src/db/schema/placements.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/job-application.md, docs/audit/gap2/lane-14/u020-college-company.md, docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md, docs/audit/gap2/lane-16/u015-job-eligibility.md, docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-8/job-slug-generator.md

## G2-12-019-013  [P1] MISSING  facet F04  effort L
- Legacy: Legacy resumeUrl application snapshot TEXT + resumeHistory JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:62-82`
- vNext now: New core has neither resumeUrl nor resumeHistory `src/db/schema/placements.ts:973-1020`
- Fix: Persist per-application resume revision history and signed-file reference.

## G2-12-019-045  [P1] MISSING  facet F14  effort L
- Legacy: Legacy resume_url/offer_letter_url/assessment_url allow text URLs `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:62-74,104-112`
- vNext now: New application core has no URL fields `src/db/schema/placements.ts:973-1020`
- Fix: Add secure signed object references and link validation for each resource.

## G2-12-019-057  [P1] MISSING  facet F22  effort L
- Legacy: Legacy applies PAP, resume, assessment, externalRef, currentRound and opt-out fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:55-82,139-175`
- vNext now: New core missing these fields `src/db/schema/placements.ts:973-1020`
- Fix: Register or explicitly retire every legacy business field with acceptance test.

## G2-12-019-061  [P1] MISSING  facet F23  effort L
- Legacy: Old application record captures resume/assessment/PAP/staff provenance and pre-withdrawal stage `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:48-102,139-175`
- vNext now: New normalized root omits many without committed replacement `src/db/schema/placements.ts:973-1020`
- Fix: Prioritize lossless field model before visual parity signoff.

## G2-14-020-029  [P1] MISSING  facet F10  effort L
- Legacy: Legacy newLink saves SHA256 token hash, resets link token and counts views/joins `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:77-92`
- vNext now: New company relation has no join hash or counters `src/db/schema/placements.ts:78-116`
- Fix: Add hashed link generation and atomic counters

## G2-16-014-009  [P1] MISSING  facet F05  effort L
- Legacy: JobOfferRepository.java:29-31 accepted EXTERNAL_IMPORT, disputable until before now.
- vNext now: placements.ts:1552-1555 fields retained; lifecycle-service.ts:117-140 lacks maturity check.
- Fix: Create external-dispute maturation query and approved cascade.

## G2-16-015-023  [P1] MISSING  facet F12  effort L
- Legacy: JobEligibility.java:34 pgMinPct only for students with PG.
- vNext now: placements.ts:842-857 no PG percentage.
- Fix: Add PG policy+evidence with not-applicable handling for non-PG.

## G2-16-015-038  [P1] MISSING  facet F22  effort L
- Legacy: JobEligibility.java:29-34 tenth/twelfth/diploma/ug/pg percentages.
- vNext now: placements.ts:842-857 four thresholds + throughout, PG missing.
- Fix: Add PG evidence/policy schema with constraint/index and evaluation.

## G2-16-015-040  [P1] MISSING  facet F23  effort L
- Legacy: JobEligibility.java:42 diversity gender private.
- vNext now: placements.ts:818-919 omits gender.
- Fix: Restore if owner wants diversity drives with sensitive attribute protection.

## G2-18-011-054  [P1] MISSING  facet F14  effort L
- Legacy: Legacy JobService itself no file upload, only HTTPS resumeUrl from uploaded profile (`JobServiceImpl.java:389-421`).
- vNext now: New create application does not persist resumeUrl at all (`application-service.ts:570-616`; `placements.ts:973-1020`).
- Fix: Add signed resume reference upload/selection with ownership and validation.

## G2-8-010-001  [P1] MISSING  facet F01  effort L
- Legacy: Old external-job URL target uses `smr-`+16-char slug for HYBRID/EXTERNAL_ONLY jobs (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:220-236`)
- vNext now: No equivalent public job slug column; public recruiter join links instead target `/college-join/` or `/company-join/` (`src/modules/placements/tpo-public-join-link-model.ts:32-34; src/db/schema/placements.ts:157-1982`)
- Fix: Decide if public HYBRID/EXTERNAL_ONLY job pages still supported; create specific job external route if required, not a recruiter-join route

## G2-8-010-020  [P1] MISSING  facet F10  effort L
- Legacy: Legacy create generates for HYBRID and EXTERNAL_ONLY only (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:491-509`)
- vNext now: VNext public recruiter join link unrelated to placementJob.visibility mode (`src/modules/placements/tpo-public-join-link-service.ts:93-105; src/db/schema/placements.ts:157-1982`)
- Fix: Reintroduce equivalent external/public application sharing for eligible drive visibility, independently of recruiter invite flow

## G2-8-010-038  [P1] MISSING  facet F22  effort L
- Legacy: Old Job table contains nullable `job_slug` unique varchar(32) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:220-236`)
- vNext now: VNext placementJobs schema uses UUID job ID; tokenHash in separate public join table, not a job slug column (`src/db/schema/placements.ts:157-1982; src/db/schema/placement-public-joins.ts:6-31`)
- Fix: Map public external job links in dedicated table keyed to job+college or add explicit slug alias with unique DB constraint

## G2-13-025-001  [P1] MISSING  facet F01  effort L
- Legacy: Recruiter-fenced GET and POST accept/decline under /api/v1/recruiter/pending-invites `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:14-29`
- vNext now: Public token/OTP acceptance only `src/modules/placements/public-recruiter-invite-accept-service.ts:65-119`; NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Add authenticated recruiter GET list, POST accept/decline endpoints, own-user scoped.

## G2-13-025-010  [P1] MISSING  facet F05  effort L
- Legacy: PendingFor WHERE recruiter_id, PENDING_HR, not soft deleted `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:295-300`
- vNext now: Grant status CHECK only ACTIVE/REVOKED `src/db/schema/placements.ts:284-292`
- Fix: Extend enum/CHECK and scoped index for pending state.

## G2-13-025-043  [P1] MISSING  facet F22  effort L
- Legacy: Status PENDING_HR and pending lead id saved before recruiter accepts `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:219-239`
- vNext now: Grant DB check disallows pending and has no pending lead FK `src/db/schema/placements.ts:206-253,284-292`
- Fix: Migration add PENDING_RECRUITER, pendingLeadId and indexes.

## G2-9-033-100  [P1] MISSING  facet F22  effort L
- Legacy: college_company private notes/contact columns `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:44-60`
- vNext now: placement_company_relationships has no CRM fields `src/db/schema/placements.ts:75-115`
- Fix: Add isolated per-college contact/notes data model and migration.

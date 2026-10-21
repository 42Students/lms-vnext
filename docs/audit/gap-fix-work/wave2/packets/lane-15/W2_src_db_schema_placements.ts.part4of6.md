# Work packet (wave 2): edit src/db/schema/placements.ts (part 4 of 6)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l13-u019-job-model.md, docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md, docs/audit/gap2/lane-4/job-preferences-repository.md, docs/audit/gap2/lane-4/l12-u015-job-role-option.md, docs/audit/gap2/lane-4/l13-u020-company-model.md, docs/audit/gap2/lane-4/l13-u030-interview-feedback-form.md

## G2-13-019-010  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:300-317`
- vNext now: `src/db/schema/placements.ts:469-476`
- Fix: Legacy nullable season and owner faculty FKs vs mandatory UUID season/optional ownerMembership.

## G2-13-019-019  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:281-300`
- vNext now: `src/db/schema/placements.ts:516-530`
- Fix: POOL drive mode, REGULAR/DREAM/SUPER_DREAM and override reason collapsed into other flags/policies.

## G2-13-019-025  [P2] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:212-213`
- vNext now: `src/db/schema/placements.ts:513-545`
- Fix: Legacy screeningVersion v1 invariant not present on placementJobs table.

## G2-13-019-026  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:363-370`
- vNext now: `src/db/schema/placements.ts:531-533`
- Fix: Legacy resultsAutoApply and cancelledAt represented by independent lifecycle/event fields, not same scalar flags.

## G2-13-019-029  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:39-41`
- vNext now: `src/db/schema/placements.ts:474-495`
- Fix: Company logo direct 500-char URL moved into global company/object path branding.

## G2-13-019-032  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:315-324`
- vNext now: `src/db/schema/placements.ts:534-545`
- Fix: Last-saved actor/time legacy fields require equivalent audit projections.

## G2-13-019-036  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:243-247`
- vNext now: `src/db/schema/placements.ts:482-495`
- Fix: Potential assessment URL visibility regression from nested legacyPostingDetails in vNext DTO.

## G2-13-019-038  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:281-298`
- vNext now: `src/db/schema/placements.ts:516-525`
- Fix: Legacy ON_CAMPUS/POOL/OFF_CAMPUS, Regular/Dream/Super Dream wording not direct new labels.

## G2-13-019-039  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:43-48`
- vNext now: `src/db/schema/placements.ts:474-479`
- Fix: Legacy denormalized companyName/logo avoid join; normalized company requires indexed relationship join.

## G2-13-019-043  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:19-24`
- vNext now: `src/db/schema/placements.ts:462-479`
- Fix: MySQL JPA JSON model vs PostgreSQL Drizzle normalized placement job, changed migrations/deployment dependencies.

## G2-13-019-044  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:66-68`
- vNext now: `src/db/schema/placements.ts:481-495`
- Fix: Legacy jdUrl requires storage provider mapping to signed asset APIs.

## G2-13-019-046  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:142-164`
- vNext now: `src/db/schema/placements.ts:482-495`
- Fix: Legacy candidatePreferences keys (skills, graduation year, preferredCity) vs vNext typed subset, possible data loss.

## G2-13-019-049  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:281-298`
- vNext now: `src/db/schema/placements.ts:516-525`
- Fix: POOL and SUPER_DREAM/categoryOverrideReason not direct mapped in job entity.

## G2-3-031-069  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:320-323`
- vNext now: `src/db/schema/placements.ts:206-289`
- Fix: Legacy activeCollegeCount and Status SUSPENDED/DELETED vs vNext grant count and ARCHIVED/DISABLED; explicit status transform.

## G2-4-015-017  [P2] GAP  facet F05  effort L
- Legacy: Legacy one-to-one unique learner_id enforces at most one preferences row. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:18-20`)
- vNext now: New membershipId primary key one row per college membership. (`src/db/schema/placements.ts:295-302`)
- Fix: Define cross-college preference duplication and identity mapping.

## G2-4-015-018  [P2] GAP  facet F05  effort M
- Legacy: Legacy finder ignores rows whose isDeleted is true. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobPreferencesRepository.java:10-12`)
- vNext now: New candidate preferences have no per-row deleted marker. (`src/db/schema/placements.ts:295-352`)
- Fix: Define preference archive/restoration when membership ends.

## G2-4-015-041  [P2] GAP  facet F12  effort S
- Legacy: Legacy jobNotificationsEnabled null maps not opted out via Boolean.FALSE.equals. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:64-69`)
- vNext now: New values are both NOT NULL. (`src/db/schema/placements.ts:334-341`)
- Fix: Backfill legacy null as true, false remains false.

## G2-4-015-058  [P2] GAP  facet F20  effort S
- Legacy: Legacy null jobNotificationsEnabled considered opted in. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:64-69`)
- vNext now: New booleans nonnull default true. (`src/db/schema/placements.ts:334-341`)
- Fix: Explicitly migrate null to enabled.

## G2-12-015-004  [P2] GAP  facet F02  effort M
- Legacy: Fields ordered package name, CTC, fixed, variable, joining bonus, stipend, duration `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:625-635`
- vNext now: New normalized record includes title, employment type, work mode, locations, openings then remuneration `src/db/schema/placements.ts:632-662`
- Fix: Restore legacy visual field order in package editor.

## G2-12-015-007  [P2] GAP  facet F04  effort M
- Legacy: Name is String; UI defaults 'Default' for missing package `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRoleOption.java:16`; `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:152-153`
- vNext now: title text NOT NULL, unique per active job `src/db/schema/placements.ts:632-633`; `src/db/schema/placements.ts:685-690`
- Fix: Default missing legacy package name while resolving same-name collisions.

## G2-12-015-013  [P2] GAP  facet F05  effort M
- Legacy: Ordered array of roleOptions in JSON `docs/legacy-source/backend/src/main/resources/db/migration/V161__tpo_v1_drives.sql:59-60`; `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:242-244`
- vNext now: Independent job-role records with no position column `src/db/schema/placements.ts:625-670`
- Fix: Add stable position ordering and import existing array order.

## G2-12-015-037  [P2] GAP  facet F20  effort M
- Legacy: JSON permits duplicate package names `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRoleOption.java:8-24`
- vNext now: Partial unique index rejects duplicate active title/job `src/db/schema/placements.ts:685-690`
- Fix: Flag duplicate source roles and resolve losslessly during migration.

## G2-13-020-009  [P2] GAP  facet F04  effort M
- Legacy: Industry max100 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:46-48`
- vNext now: New industry varchar160 `src/db/schema/placements.ts:34`
- Fix: Enforce legacy max100 and report oversized imported values.

## G2-13-020-010  [P2] GAP  facet F04  effort M
- Legacy: Description max2000 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:50-52`
- vNext now: New about field unrestricted text `src/db/schema/placements.ts:35`
- Fix: Map description→about and 2000 max.

## G2-13-020-013  [P2] GAP  facet F04  effort M
- Legacy: Shared historical collegeId, organizationId, addedBy type/id/college `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:70-83`
- vNext now: New UUID creator and relationship college, no legacy provenance type fields `src/db/schema/placements.ts:41-56`; `src/db/schema/placements.ts:75-106`
- Fix: Document migrated created-by and legacy provenance separately.

## G2-13-020-014  [P2] GAP  facet F04  effort M
- Legacy: Verified-by-42 boolean, timestamp, actor ID `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:85-93`
- vNext now: New verifiedAt and verifiedByUserId pair; no explicit false bool `src/db/schema/placements.ts:36-37`; `src/db/schema/placements.ts:67`
- Fix: Map true/false from timestamp+user, preserve old verifier attribution.

## G2-13-020-036  [P2] GAP  facet F13  effort M
- Legacy: Soft deleted globally vs per-college distinguished `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:91-102`
- vNext now: New company and relationship each ACTIVE/ARCHIVED `src/db/schema/placements.ts:38-40`; `src/db/schema/placements.ts:87-90`
- Fix: Map deleted vs archived state and merged redirects across both layers.

## G2-13-020-048  [P2] GAP  facet F22  effort M
- Legacy: Legacy company name varchar150, industry100, URL500, description2000 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:33-52`
- vNext now: New text name/url/about and industry varchar160 `src/db/schema/placements.ts:26-35`
- Fix: Add precise constraints and import violations report.

## G2-13-030-008  [P2] MISSING  facet F04  effort M
- Legacy: Candidate name fallback 'Candidate' `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:14-16`
- vNext now: New rounds result stored by application UUID, no candidate banner `src/db/schema/placements.ts:1393-1405`
- Fix: Join scoped learner identity and show same fallback.

## G2-13-030-010  [P2] GAP  facet F04  effort M
- Legacy: SubmittedAt displayed browser toLocaleString, rating X/5, recommendation title text, optional comments `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:75-93`
- vNext now: New records submittedAt, scorePercent and internalComment `src/db/schema/placements.ts:1403-1424`
- Fix: Map timezone/format, star rating, recommendation and privacy-protected notes.

## G2-4-023-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy verifiedBy42 and isDeleted are independent company flags (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:59-67`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDirectoryService.java:235-243`)
- vNext now: New company status ACTIVE/ARCHIVED with verifiedAt/by and relationship archive status (`src/db/schema/placements.ts:23-72,75-114`)
- Fix: Map verified bool and deleted state without reviving archived/merged records.

## G2-4-023-070  [P2] GAP  facet F22  effort M
- Legacy: Legacy company numeric id, college id and recruiter actor id (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:39-68`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/CompanyJoinService.java:77-115`)
- vNext now: New UUID PKs, FK scoped collegeId and companyId (`src/db/schema/placements.ts:23-86`)
- Fix: Use legacy-ID to UUID map and backfill link identities without exposing raw hashes.

## G2-13-021-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy auto int id via BaseModel and application unique FK. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:18-29`
- vNext now: vNext applicationId UUID PK/FK one screening row. `src/db/schema/placements.ts:1114-1143`
- Fix: Map legacy ID to application UUID and keep uniqueness.

## G2-13-021-015  [P2] GAP  facet F06  effort M
- Legacy: Legacy create record PENDING, score fields default0/null. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:38-58`
- vNext now: vNext manual screening starts PENDING with all decision fields null. `src/db/schema/placements.ts:1114-1149`
- Fix: Keep separate auto status lifecycle if reintroducing scores.

## G2-13-021-050  [P2] GAP  facet F22  effort M
- Legacy: Legacy soft delete isDeleted filter; unique app constraint. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ApplicationScreeningRepository.java:16-59`
- vNext now: vNext no screening isDeleted; history archive via app lifecycle. `src/db/schema/placements.ts:1114-1149`
- Fix: Document soft delete and retention policy.

## G2-5-013-008  [P2] GAP  facet F04  effort L
- Legacy: Legacy Job entity includes legacy fields jobType/location/ctcRange/importantDates/targeting/visibility (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:31-120`)
- vNext now: vNext placements table normalizes job salary, location, application mode and deadline (`src/db/schema/placements.ts:462-515`)
- Fix: Create field crosswalk including null placeholders/currency precision/optional dates

## G2-5-013-020  [P2] GAP  facet F06  effort M
- Legacy: Legacy offer letter attaches URL to application by app/job/college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:128-130`)
- vNext now: vNext offers are separate from core application row (`src/db/schema/placements.ts:973-1019`)
- Fix: Map attachment to offer document record and keep old URL validation behavior

## G2-5-013-049  [P2] GAP  facet F10  effort M
- Legacy: Legacy getDataRetentionReport reads terminal REJECTED/WITHDRAWN older than threshold (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1675-1724`)
- vNext now: vNext core statuses SUBMITTED/WITHDRAWN only (`src/db/schema/placements.ts:1043-1059`)
- Fix: Report terminal rejection using screening stage and withdrawal separately

## G2-5-013-060  [P2] GAP  facet F12  effort M
- Legacy: Legacy create defaults visibility INTERNAL_ONLY and validates HYBRID EXTERNAL_ONLY (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:478-516`)
- vNext now: vNext applicationMode default INTERNAL in schema (`src/db/schema/placements.ts:506-509`)
- Fix: Map visibility vs application channel to avoid off-platform leaks

## G2-5-013-068  [P2] GAP  facet F14  effort M
- Legacy: Legacy offer letter URL attachment supported directly on JobApplication (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:128-130`)
- vNext now: vNext core application has no offerLetterUrl; separate offer records required (`src/db/schema/placements.ts:973-1019`)
- Fix: Map signed file/document link to normalized offer attachment feature

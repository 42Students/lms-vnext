# Work packet: edit src/db/schema/placements.ts (part 10 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l13-u019-job-model.md, docs/audit/gap2/lane-3/public-recruiter-invite-controller.md, docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md, docs/audit/gap2/lane-4/job-preferences-repository.md, docs/audit/gap2/lane-4/l12-u010-job-notification-helper.md, docs/audit/gap2/lane-4/l12-u015-job-role-option.md

## G2-13-019-045  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:19-27`
- vNext now: `src/db/schema/placements.ts:465-478`
- Fix: Numeric job ID and organization/company/owner FK vs UUID college+season+relationship+user migration.

## G2-13-019-047  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:348-361`
- vNext now: `src/db/schema/placements.ts:625-735`
- Fix: Eligibility/roleOptions/previousRequest JSON requires relational ETL with multiple-role compensation mapping.

## G2-13-019-048  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:55-64`
- vNext now: `src/db/schema/placements.ts:513-518`
- Fix: recordedOutside/countsAsPlaced and publish notification/reporting semantics need direct crosswalk.

## G2-13-019-050  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:195-198`
- vNext now: `src/db/schema/placements.ts:482-495`
- Fix: evaluationConfig WRITE_ONLY and assessmentUrl @JsonIgnore must retain restrictions across API projections.

## G2-3-026-078  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:202-268`
- vNext now: `src/db/schema/placements.ts:158-289`
- Fix: Legacy recruiter and recruiter_college_access numeric records with PENDING_HR status map to users/profiles/UUID grants with only active acceptance flow; record data/transition crosswalk.

## G2-3-031-068  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:51-59`
- vNext now: `src/db/schema/placements.ts:158-289`
- Fix: Legacy recruiter numeric account, RecruiterCollegeAccess college grants with validUntil/status; vNext user UUID + placementRecruiterProfiles + relationship-bound grants. Full ETL needed.

## G2-4-015-003  [P1] GAP  facet F01  effort M
- Legacy: Repository finder scoped by integer learnerId and not soft-deleted. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobPreferencesRepository.java:9-12`)
- vNext now: New candidate preference rows use UUID college membershipId. (`src/db/schema/placements.ts:295-302`)
- Fix: Map learner identity to active scoped membership across possible colleges.

## G2-4-015-016  [P1] GAP  facet F04  effort M
- Legacy: Legacy jobNotificationsEnabled Boolean not-null default true. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:41-45`)
- vNext now: New candidate preferences two not-null booleans, both default true. (`src/db/schema/placements.ts:334-341`)
- Fix: Map false to both disabled on migration, preserve true by default.

## G2-4-015-038  [P1] GAP  facet F11  effort M
- Legacy: Legacy dispatcher scopes template to job college but finder uses learner integer identity. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:64-69`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:89-94`)
- vNext now: New preferences key is college membershipId. (`src/db/schema/placements.ts:295-302`)
- Fix: Resolve correct membership and college at dispatch.

## G2-4-015-062  [P1] GAP  facet F22  effort L
- Legacy: Legacy single job_preferences table unique learner ID nullable strings and boolean true. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:10-45`)
- vNext now: New profileDocument JSON plus placement_candidate_preferences keyed by UUID. (`src/modules/people/profile-validation.ts:509-518`; `src/db/schema/placements.ts:295-341`)
- Fix: Document full migration, uniqueness and data ownership map.

## G2-4-015-064  [P1] GAP  facet F22  effort L
- Legacy: Legacy single job flag controls application event notices. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:41-45`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:64-87`)
- vNext now: New two per-membership notification flags have independent state. (`src/db/schema/placements.ts:334-341`)
- Fix: Backfill old false to both false and define application event recipient policy.

## G2-12-010-043  [P1] GAP  facet F22  effort M
- Legacy: Legacy preference boolean column job_notifications_enabled default true `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:41-45`
- vNext now: New two booleans notifyMatchingJobs, notifyApplicationUpdates `src/db/schema/placements.ts:334-339`
- Fix: Write historical opt-out migration/crosswalk, preserving false for both applicable categories.

## G2-12-015-001  [P1] GAP  facet F01  effort M
- Legacy: Packages nested in legacy TPO DriveForm.roleOptions `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:47-49`, created in Pay packages `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:620-642`
- vNext now: Normalized placementJobRoleOptions `src/db/schema/placements.ts:625-665`; HR salary draft is single group `src/modules/placements/hr-drive-draft-model.ts:31-41`
- Fix: Provide repeatable per-drive pay packages in equivalent entry flow.

## G2-12-015-008  [P1] GAP  facet F04  effort M
- Legacy: ctcLpa arbitrary BigDecimal by package `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRoleOption.java:17`
- vNext now: Minimum/maximum CTC INR integer on role; job-wide ctcLpa numeric `src/db/schema/placements.ts:643-650`; `src/db/schema/placements.ts:527-530`
- Fix: Persist exact package CTC LPA rather than infer from min/max INR.

## G2-12-015-012  [P1] MISSING  facet F04  effort M
- Legacy: Stipend/month BigDecimal and duration months Integer `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRoleOption.java:21-23`
- vNext now: No package-level stipend or duration in role table `src/db/schema/placements.ts:625-665`
- Fix: Add numeric stipend_per_month and positive stipend_months fields.

## G2-12-015-015  [P1] GAP  facet F06  effort M
- Legacy: Package name editable; blank maps to 'Default' `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:242-244`
- vNext now: New requires nonblank title and uniqueness `src/db/schema/placements.ts:632-633`; `src/db/schema/placements.ts:685-690`
- Fix: Normalize blanks with display default and friendly duplicate validation.

## G2-12-015-023  [P1] GAP  facet F10  effort M
- Legacy: Server receives all seven package pay fields `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:242-244`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:47`
- vNext now: New role row cannot persist stipend duration `src/db/schema/placements.ts:643-665`
- Fix: Extend create/update request and Drizzle write mapping without information loss.

## G2-12-015-026  [P1] GAP  facet F12  effort M
- Legacy: Historical bondNone/bondMonths/bondAmount ignored since 8 Oct `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRoleOption.java:9-11`
- vNext now: bondMonths/bondAmount are typed and available again `src/db/schema/placements.ts:659-660`; `src/modules/placements/hr-drive-draft-model.ts:40-41`
- Fix: Document owner change or remove bond editing.

## G2-12-015-027  [P1] GAP  facet F12  effort M
- Legacy: At least one package with CTC or stipend for publishing `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:443-444`
- vNext now: New primary flag and pay checks don't imply nonempty package collection `src/db/schema/placements.ts:682-730`
- Fix: Require at least one ACTIVE primary role with valid pay before publish.

## G2-12-015-036  [P1] GAP  facet F20  effort M
- Legacy: BigDecimal CTC max comparison `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementCascadePolicy.java:93-99`
- vNext now: Role salary bound to numeric(10,2) and integer INR min/max `src/db/schema/placements.ts:643-658`
- Fix: Specify rounding on LPA→INR, overflow, precision >2dp.

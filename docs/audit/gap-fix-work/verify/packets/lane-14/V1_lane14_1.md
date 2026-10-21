# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-009-053 [P1] GAP facet F21
- Files: src/db/schema/tpo-collaboration.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:44-55`: reads external share/download audit from tpo_share_event.
- Expected fix: Connect learner data-access read to share-event schema with stage/visibility controls.

## G2-1-006-063 [P1] GAP facet F23
- Files: src/modules/auth/login-service.ts
- Legacy: `PublicMobileAuthController.java:479-498` recruiter email must corporate on college host and dummy responses for denied identity.
- Expected fix: Enforce recruiter tenant/grant/corporate policy and anti-enumeration via verified identity and membership.

## G2-1-013-043 [P1] GAP facet F20
- Files: src/modules/auth/login-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:483-488`: tenant inference and corporate-domain restriction checked on every start.
- Expected fix: Test global, wrong college, no active grant, pending invite and personal domain cases.

## G2-1-035-033 [P1] GAP facet F07
- Files: src/modules/placements/recruiter-profile-details-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:160: 'First name is required' field error from AntD.
- Expected fix: Show First name required directly under input before request.

## G2-1-008-043 [P1] MISSING facet F08
- Files: src/modules/auth/login-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:195-199`: `OTP lockout cleared`.
- Expected fix: On authorized unlock display exact feedback and actor audit.

## G2-10-031-013 [P1] GAP facet F05
- Files: src/components/ui/data-table.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:260,285,293-295 — Name, Drives and Last active sortable; default Last active descend.
- Expected fix: Add canonical sortable column controls with default and persisted order.

## G2-13-026-023 [P1] GAP facet F10
- Files: src/modules/academics/semester-mutation-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:66-74 — create POST writes new_program_structure.
- Expected fix: Migrate create semantics and preserve legacy fields.

## G2-10-002-083 [P1] GAP facet F22
- Files: src/db/schema/db10-announcements.ts
- Legacy: Legacy fields audience_kind json label recipient_count sent_at email and is_deleted `docs/legacy-source/backend/src/main/resources/db/migration/V217__announcements_audience_reach_schedule.sql:6-19`
- Expected fix: Add required author-side reach metadata or compute exact broadcast counts via relations

## G2-10-015-053 [P1] GAP facet F12
- Files: src/modules/placements/college-drive-applications-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:116-119 — Default ASSESSMENT on shortlist route, user stage choice saved.
- Expected fix: Use scoped four-stage default.

## G2-10-015-083 [P1] GAP facet F22
- Files: src/modules/placements/college-drive-applications-model.ts, src/modules/placements/college-stage-action-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-105 — Numeric jobApplication ID, canonical status, score, notes, optimistic version.
- Expected fix: Add field mapping to support legacy view with truthful data.

## G2-10-020-043 [P1] GAP facet F07
- Files: src/app/(authenticated)/admin/programs/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:303-309 — Refresh keeps prior rows same college, error warns.
- Expected fix: Retain last-good per-college data with warning and retry.

## G2-11-004-013 [P1] GAP facet F03
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: Round row Remove action allows deleting all rounds `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:399`
- Expected fix: Allow zero rounds for optional process

## G2-12-020-053 [P1] GAP facet F22
- Files: src/db/schema/placement-company-identities.ts, src/modules/placements/super-admin-company-identities-service.ts, src/modules/placements/tpo-company-domain-service.ts
- Legacy: Legacy explicit CompanyDomain table allows multiple domains for same company `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CompanyDomain.java:14-32`
- Expected fix: Unify write paths and enforce primaryDomain child FK/invariant.

## G2-12-018-033 [P1] MISSING facet F12
- Files: src/db/schema/academic-terms.ts
- Legacy: Old STATUS COMPLETED is sticky on activate sibling (do not inactivate completed) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:90-99`
- Expected fix: Store COMPLETED explicitly and exempt it from peer deactivation.

## G2-12-018-053 [P1] GAP facet F22
- Files: src/db/schema/academic-terms.ts
- Legacy: Old uses StatusType Enum + nullable status column `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:30-32`
- Expected fix: Store complete historical statuses separately.

## G2-12-017-013 [P1] MISSING facet F04
- Files: src/db/schema/projects.ts, src/db/schema/project-audit-staged.ts
- Legacy: Old progressValue nullable integer stores progress percent `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:34-35`
- Expected fix: Promote progress_value with 0..100 validation, expose it in activity feed.

## G2-12-002-073 [P1] GAP facet F22
- Files: src/db/schema/academic-terms.ts
- Legacy: Legacy integer semester_course, isMandatory boolean, credits=3 default, nullable course_order `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:17-38`
- Expected fix: Map conceptual fields and defaults

## G2-19-029-043 [P1] GAP facet F12 Policy edge
- Files: (none, new feature)
- Legacy: LB:204-212 verified domain only blocker under strict requirement; missing logo never blocks LB:216-220
- Expected fix: Encode strict-domain-policy input and optional branding explicitly; add fixture matrices strict vs lenient

## G2-13-018-003 [P1] GAP facet F01
- Files: src/modules/academics/program-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/NewProgramController.java:86-115` /fetchAll supports unscoped superadmin listing across orgs
- Expected fix: Provide approved global superadmin all-college discovery or explicitly retire with actor and UI mapping

## G2-13-017-003 [P1] GAP facet F01
- Files: src/modules/projects/mentor-task-delete-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskRepository.java:15-26` active vs all rows separately for deletion-aware template merge
- Expected fix: Add durable deleted-template-item suppression/tombstone mapping when merging templates into workspace

## G2-13-017-013 [P1] GAP facet F04
- Files: src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:68-75` assigneeId/assigneeType/assigneeName denormalized
- Expected fix: Resolve learner/faculty ID namespace ambiguity and preserve historical assignee display snapshot when needed

## G2-13-016-003 [P1] GAP facet F01
- Files: src/modules/identity/constants.ts, src/modules/identity/context-service.ts
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:14-32` frontend account roles includes SUPER_ADMIN,ADMIN,TPO,MENTOR,FACULTY,LEARNER,RECRUITER
- Expected fix: Write exact account-role mapping (ADMIN→COLLEGE_ADMIN; RECRUITER→profile/grants) with stable routing labels

## G2-13-016-023 [P1] GAP facet F11
- Files: src/modules/identity/context-service.ts
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:56-68` resolves app role by userType/facultyType/id, not necessarily stored User.roles
- Expected fix: Audit legacy JWT/legacy Role table consistency and base migration on authoritative resolved identity, not only User.roles

## G2-14-017-003 [P1] GAP facet F02
- Files: src/db/schema/projects.ts
- Legacy: Legacy sprint combines planning dates, task-derived status, explicit lifecycle, release and attribution `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:44-128`
- Expected fix: Preserve missing derived status and attribution in display projection

## G2-14-017-063 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: Legacy dueLabel/releaseLabel and started/completed actor/time fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:59-120`
- Expected fix: Provide reversible migration for lost display/attribution data

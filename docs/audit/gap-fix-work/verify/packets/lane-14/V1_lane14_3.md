# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-019-013 [P1] GAP facet F04
- Files: src/db/schema/courses.ts, src/modules/courses/progress-service.ts
- Legacy: Legacy completedAt first mark, firstCompletedAt immutable within attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:33-40`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:176-187`)
- Expected fix: Write immutable firstCompletedAt in same transaction for first completion.

## G2-4-018-073 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: Legacy MySQL file metadata added in later migrations to original V81 schema. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:40-53`; `docs/legacy-source/backend/src/main/resources/db/migration/V81__project_delivery.sql:1-35`)
- Expected fix: Verify migration or explicitly no-data-parity decision without losing active records.

## G2-4-025-013 [P1] GAP facet F04
- Files: src/db/schema/db10-skills-catalog.draft.ts
- Legacy: Database int identity id and 200-character name/displayName (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Skill.java:22-30`)
- Expected fix: Provide integer legacy ID mapping when legacy profile/selection APIs require it.

## G2-5-019-003 [P1] GAP facet F02
- Files: src/db/schema/users.ts, src/db/schema/memberships.ts, src/db/schema/profiles.ts
- Legacy: Legacy single learner record contains account, academic, profile sections `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:20-232`
- Expected fix: Create field-level migration and unified view projection.

## G2-5-023-013 [P1] GAP facet F04
- Files: src/db/schema/placement-drive-change-requests.ts
- Legacy: Legacy includes current drive field value at time of request, and status resolution timestamp. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:78-83`
- Expected fix: Persist snapshot of current value and separate outcome/answer fields.

## G2-5-023-063 [P1] GAP facet F22
- Files: src/db/schema/placement-drive-change-requests.ts, drizzle/0114_drive_change_requests.sql
- Legacy: Legacy application-level unique OPEN (job,field,direction), except OTHER. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/DriveChangeRequestService.java:126-130`, `src/db/schema/placement-drive-change-requests.ts:23-31`
- Expected fix: Add partial unique index on active field/party requests excluding OTHER.

## G2-5-024-023 [P1] GAP facet F07
- Files: src/db/schema/college-branding.ts, src/modules/colleges/branding-service.ts
- Legacy: Legacy rejects unknown sign-in methods with precise message. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:588-595`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:38-50`
- Expected fix: Validate four sign-in methods in proper auth settings contract.

## G2-5-024-063 [P1] GAP facet F22
- Files: src/db/schema/college-branding.ts
- Legacy: Legacy college_branding int pk/college id, login_methods, nullable presentation fields. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:10-62`
- Expected fix: Map sign-in and remediate invalid legacy URLs/colours.

## G2-5-025-063 [P1] GAP facet F22
- Files: src/db/schema/academic-terms.ts
- Legacy: Legacy semester and semester_course have numeric IDs, snake_case serialization, isMandatory boolean and order. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Semester.java:16-40`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SemesterCourse.java:15-39`
- Expected fix: Provide migration mapping for identity/enum/credits/order, including missing mappings.

## G2-5-029-013 [P1] GAP facet F04
- Files: src/modules/projects/super-admin-template-create-model.ts
- Legacy: Legacy repeating sprints/tasks/resources arrays preserve multiple entries and relationship IDs. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:96-128`
- Expected fix: Preserve arbitrary repeated arrays and task-to-sprint link semantics.

## G2-5-029-023 [P1] GAP facet F06
- Files: src/modules/projects/super-admin-template-create-model.ts
- Legacy: Legacy arrays can have zero sprints, tasks or resources at creation. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:285-306`
- Expected fix: Separate draft create from publish readiness, permit zero work items.

## G2-12-011-003 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: Feed max40 items 30 days, newest-first (RecruiterNotificationService.java:65-70,136-137).
- Expected fix: Show 40 items or provide equivalent immediate reachability to all entries.

## G2-7-002-023 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/audit/index.js:595-605: only All time paginates, 25 items/page via numerical pages.
- Expected fix: Implement 200-row short-range bounded list and 25-row All time pagination.

## G2-7-004-073 [P1] GAP facet F22
- Files: src/db/schema/activity.ts
- Legacy: LBE/model/ProjectWorkspace.java:104-119: readiness_override and note/by/at persisted columns.
- Expected fix: Plan migration and clear-state replay from persistent row to event history; do not silently lose old overrides.

## G2-7-020-103 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: AdminProjectCreateDTO.java:14-18 title VARCHAR160 and @Size160
- Expected fix: Enforce legacy cap or explicitly migrate contract and document

## G2-7-021-093 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: reassign-mentor.js:109 lifecycle ARCHIVED excluded
- Expected fix: Map old ACTIVE/READY/IN_PROGRESS/BLOCKED status to vNext before filter and workload

## G2-7-026-023 [P1] GAP facet F05
- Files: src/app/(authenticated)/mentor/notifications/page.tsx
- Legacy: notifications.js:341-345 unified list sorted announcement first, then review/requested, stalled, upcoming
- Expected fix: Implement equivalent combined ordered feed or explicitly retire priority contract

## G2-7-029-093 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: superadmin/projects/at-risk/index.js:237-298 eight columns from ProjectWorkspaceDTO, status ACTIVE/IN_PROGRESS/READY/BLOCKED/ARCHIVED
- Expected fix: Map legacy READY/BLOCKED statuses to new independent risk reasons and display status

## G2-7-036-043 [P1] GAP facet F11
- Files: src/components/admin/super-admin-faculty-bulk-import.tsx
- Legacy: Faculty.js:634-643 requires college and department for validation
- Expected fix: Restore department selection or record explicit default mapping

## G2-8-020-013 [P1] GAP facet F04
- Files: src/db/schema/courses.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:42-43 slug VARCHAR64 unique globally
- Expected fix: Keep URL identifier distinct from course code or publish stable migration aliases.

## G2-8-020-043 [P1] GAP facet F12
- Files: src/db/schema/courses.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CourseServiceImpl.java:59-105 generates random valid slug, max5 retries
- Expected fix: Provide deterministic URL alias and preserve old slug references.

## G2-8-027-003 [P1] GAP facet F01
- Files: src/db/schema/placement-round-candidate-slots.ts
- Legacy: Legacy GET /application/{id} and /learner/{id}/organization/{orgId} (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/InterviewController.java:396-399,475-482).
- Expected fix: Expose application/learner interview list with old links redirected to new round rows.

## G2-8-010-023 [P1] GAP facet F11
- Files: src/db/schema/placement-public-joins.ts
- Legacy: Legacy Job.jobSlug globally unique, organization/college stored on Job (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:127-135,220-236`)
- Expected fix: Use tenant-scoped external job resolution; enforce row-level authorization and company/job association separately

## G2-8-024-043 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy suspended and deleted differ (suspendedAt vs isDeleted), revocations persist (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:286-315).
- Expected fix: Map suspended/deleted/disabled/archived distinctly to prevent accidental sign-in restoration.

## G2-8-023-063 [P1] MISSING facet F20
- Files: src/components/tpo/tpo-bulk-action-panel.tsx
- Legacy: Legacy undo group is outbox-controlled, late notices cannot be cancelled (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:160-175).
- Expected fix: Document exact undo lifetime and implement safe reversible application actions.

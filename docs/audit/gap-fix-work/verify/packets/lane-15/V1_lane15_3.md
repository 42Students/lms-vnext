# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-3-011-033 [P1] MISSING facet F12
- Files: src/modules/placements/tpo-draft-drive-model.ts, src/components/tpo/tpo-draft-drive-step-one-form.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:93-105`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ChoicesController.java:32-45`
- Expected fix: Legacy new drive accepts visible custom labels and all five built-ins, retains hidden historical type; vNext draft enum limits FULL_TIME, INTERNSHIP, CONTRACT. Add complete college-scoped list and historical retention.

## G2-12-014-013 [P1] GAP facet F04
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:15-21`
- Expected fix: Legacy numeric IDs and organizationId on application DTO replaced with UUID application/job/membership; college selected through Job→College, roleOptionId added.

## G2-13-019-023 [P1] GAP facet F11
- Files: src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:243-247`
- Expected fix: Legacy assessmentUrl @JsonIgnore; vNext nested assessmentUrl field requires strict public DTO redaction.

## G2-3-027-083 [P1] GAP facet F22
- Files: src/modules/courses/lesson-content-order-service.ts
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V37__lesson_content_class_sequence.sql:1-14`
- Expected fix: Legacy per-class content sequence override table UNIQUE(content_id,class_id), vNext staged lessonContentDeliverySequences and runtime gate; migration and scope crosswalk needed.

## G2-3-016-033 [P1] GAP facet F12
- Files: src/db/schema/assessments.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:60-86`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:821-858`
- Expected fix: Legacy four grading statuses NOT_GRADED,AUTO_GRADED,MANUALLY_GRADED,PARTIALLY_GRADED and graded int; vNext enum only NOT_GRADED/GRADED. Provide typed mapping and display old distinctions when importing.

## G2-3-016-053 [P1] MISSING facet F23
- Files: src/db/schema/assessments.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:84-86`
- Expected fix: Legacy semesterNumber intentionally stamps term and reattempt semantics, missing from vNext with no recorded exclusion reason. Add field/logic.

## G2-4-033-013 [P1] GAP facet F05
- Files: src/modules/messaging/providers.ts
- Legacy: Legacy notification dispatcher routes event types by central registry `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:53-70`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-157`
- Expected fix: Produce event-by-event matrix, including email/SMS opt-out and old template mapping.

## G2-4-020-013 [P1] GAP facet F04
- Files: src/db/schema/profiles.ts, src/db/schema/memberships.ts
- Legacy: Legacy FacultyType values PERMANENT,GUEST,VISITING,CONTRACT,ADMIN,HEAD,COORDINATOR,CLERK,PROFESSOR,ASSOCIATE_PROFESSOR,ASSISTANT_PROFESSOR,LECTURER,ADJUNCT,MENTOR,TPO. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/FacultyType.java:3-9`)
- Expected fix: Map every ordinal and role overlap without reordering historical enum.

## G2-4-020-023 [P1] GAP facet F06
- Files: src/db/schema/profiles.ts
- Legacy: Legacy facultyType is ordinal Java enum with append-only values. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/enums/FacultyType.java:3-9`)
- Expected fix: Create explicit ordinal-to-code migration, do not cast integer to string label.

## G2-4-015-003 [P1] GAP facet F01
- Files: src/db/schema/placements.ts
- Legacy: Repository finder scoped by integer learnerId and not soft-deleted. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobPreferencesRepository.java:9-12`)
- Expected fix: Map learner identity to active scoped membership across possible colleges.

## G2-12-010-043 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: Legacy preference boolean column job_notifications_enabled default true `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:41-45`
- Expected fix: Write historical opt-out migration/crosswalk, preserving false for both applicable categories.

## G2-12-015-023 [P1] GAP facet F10
- Files: src/db/schema/placements.ts
- Legacy: Server receives all seven package pay fields `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:242-244`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/tpo/DriveForm.java:47`
- Expected fix: Extend create/update request and Drizzle write mapping without information loss.

## G2-13-020-033 [P1] MISSING facet F11
- Files: src/db/schema/placements.ts
- Legacy: College-private fields isolated in college_company `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:15-17`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:35-45`
- Expected fix: Add tenant-isolated fields with no cross-college read access.

## G2-4-029-063 [P1] GAP facet F22
- Files: src/db/schema/project-audit-staged.ts
- Legacy: Legacy project_resource_audit int PK, MySQL datetime/json indexes (`docs/legacy-source/backend/src/main/resources/db/migration/V80__project_resource_audit.sql:1-21`)
- Expected fix: Create stable legacy ID mapping and preserve audit chronology.

## G2-17-019-043 [P1] MISSING facet F21
- Files: src/db/schema/db06-history-staged.ts
- Legacy: Legacy JPA GradeAuditLogRepository save. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1093-1104`
- Expected fix: Wire Drizzle event table export and numbered migration.

## G2-5-002-023 [P1] GAP facet F06 Forms
- Files: src/modules/placements/college-interview-directory-service.ts
- Legacy: Status choice All statuses / Active / Completed / Cancelled; Active includes three states. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:71-76; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:254-262)
- Expected fix: Preserve Active set incl Confirmed and Reschedule requested.

## G2-5-013-053 [P1] GAP facet F10
- Files: src/db/schema/placements.ts
- Legacy: Legacy getApplicationHistory returns status history ascending changedAt (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:159-166`)
- Expected fix: Combine normalized stage/offer/decision histories chronologically in detail timeline

## G2-5-024-003 [P1] GAP facet F01
- Files: src/app/api/admin/settings/overrides/route.ts, src/modules/platform-settings/admin-editor-service.ts
- Legacy: Legacy supports GLOBAL, ORG, COLLEGE settings read, PUT and per-key delete. `docs/legacy-source/frontend/src/api/Services/TenantAdminService.js:36-52`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/TenantAdminController.java:695-763`
- Expected fix: Restore ORG settings reader/editor or record approved removal.

## G2-6-019-013 [P1] MISSING facet F04
- Files: src/db/schema/placements.ts
- Legacy: Legacy papInterest Yes/No/Need more info (JobPreferences.java:38-39).
- Expected fix: Map PAP interest into a confidential placement assistance preference or explicit program enrollment record.

## G2-15-024-023 [P1] MISSING facet F20
- Files: (none, new feature)
- Legacy: @Transactional seed() all-or-nothing unless helper external writes (E2eSeedService.java:164-168).
- Expected fix: Guarantee transaction rollback on partial seed failure and retryability.

## G2-7-002-033 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LBE/controller/AdminProjectController.java:737-779: unauthenticated 401, college invalid 400, unauthorized 403.
- Expected fix: Render explicit denied/session error from activity.read distinct from transient DB failures.

## G2-7-004-043 [P1] GAP facet F11
- Files: src/modules/projects/admin-readiness-overrides-service.ts
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:161-168: archived omitted from chooser, but archived with override deliberately present in Active overrides.
- Expected fix: Include archived overrides in audit list; keep chooser exclusion.

## G2-7-012-013 [P1] MISSING facet F04
- Files: src/modules/projects/workspace-view-service.ts, src/components/projects/project-workspace.tsx
- Legacy: readiness.js:30-38 Proof coverage completed tasks with submissionUrl over completed tasks
- Expected fix: Compute DONE task evidence coverage and zero case

## G2-7-028-063 [P1] GAP facet F12
- Files: src/app/(authenticated)/mentor/projects/page.tsx
- Legacy: ProjectsContent.jsx:397-419 archived suppressed action nextAction
- Expected fix: Disable misleading unfinished-action line for archived

## G2-8-019-053 [P1] GAP facet F22
- Files: src/db/schema/placements.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplicationStatusHistory.java:22-23 old_status VARCHAR50
- Expected fix: Provide lossless legacy stage-status mapping.

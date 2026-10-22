# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-013-035 [P1] GAP facet F15
- Files: src/modules/auth/login-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:495-497`: fake success must not send email to unauthorized user.
- Expected fix: Keep no-send behavior but equalize public response to defend enumeration.

## G2-1-013-049 [P1] GAP facet F23
- Files: src/modules/auth/login-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicMobileAuthController.java:495-497`: fake success on unauthorized recruiter protects roster privacy.
- Expected fix: Keep anti-enumeration behavior and security reviewed user-facing message.

## G2-1-035-034 [P1] GAP facet F07
- Files: src/modules/placements/recruiter-profile-details-model.ts
- Legacy: docs/legacy-source/frontend/src/pages/recruiter/profile.js:106-108: INVALID_MOBILE sets phone field and 'Check the mobile number.' summary.
- Expected fix: Map INVALID_MOBILE/400 Zod path to mobile input, retain old summary.

## G2-1-008-061 [P1] GAP facet F12
- Files: src/modules/auth/login-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:246-252`: faculty-first lookup; unscoped if no collegeId.
- Expected fix: Test same phone across colleges/roles and ensure correct tenant chooser.

## G2-10-031-021 [P1] GAP facet F05
- Files: src/components/ui/data-table.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:827-835 — row selection with disabled draft rows, supports bulk action.
- Expected fix: Add checkbox row-selection and resource-specific bulk controls.

## G2-10-027-085 [P1] GAP facet F22
- Files: src/db/schema/storage-files.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:683-701 — Generic R2 key with folder/userId/projectId/UUID extension.
- Expected fix: Map legacy key to vNext asset/receipt IDs

## G2-10-027-086 [P1] GAP facet F22
- Files: src/db/schema/storage-files.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:711-736 — AssignmentUploadReceipt has receiptId, storageKey, publicUrl, ownerUserType.
- Expected fix: Preserve legacy receipt lookups via translation

## G2-13-026-007 [P1] GAP facet F04
- Files: src/db/schema/academic-terms.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:19-32 — name, programId, startDate/endDate strings, courseIds JSON, StatusType status.
- Expected fix: Map legacy dates/status/course membership to normalized term model.

## G2-13-026-024 [P1] GAP facet F10
- Files: src/modules/academics/semester-mutation-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:76-88 and docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:45-59 — update PUT partial fields, does not update programId.
- Expected fix: Preserve partial-update semantics and course/date fields if still required.

## G2-13-026-026 [P1] GAP facet F10
- Files: src/modules/academics/semester-mutation-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProgramStructureController.java:123-139 and docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:77-104 — status ACTIVE deactivates non-completed sibling terms.
- Expected fix: Implement active semester sibling exclusivity if still required.

## G2-13-026-030 [P1] GAP facet F12
- Files: src/modules/academics/semester-mutation-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ProgramStructureServiceImpl.java:77-104 — ACTIVE sets non-COMPLETED siblings INACTIVE atomically.
- Expected fix: Reproduce switch semantics and protect completed terms.

## G2-13-026-047 [P1] GAP facet F22
- Files: src/db/schema/academic-terms.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:14-32 — new_program_structure table name, string dates, courseIds JSON and StatusType enum.
- Expected fix: Map table ID, status, courseIds, dates and membership in migration.

## G2-13-026-048 [P1] GAP facet F22
- Files: src/db/schema/academic-terms.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:13-23 — programId Integer, structure id inherited numeric.
- Expected fix: Supply legacy ID translation and semester numbering.

## G2-13-026-049 [P1] GAP facet F22
- Files: src/db/schema/academic-terms.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/NewProgramStructure.java:30-32 — legacy COMPLETED status possible.
- Expected fix: Represent completed historical term state.

## G2-14-023-007 [P1] GAP facet F04
- Files: src/db/schema/placement-learner-general-requests.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/StudentRequest.java:36-74 — Long id; learnerId, type, jobId, applicationId, arbitrary payload, reason, status and decision metadata.
- Expected fix: Map legacy learner/job/application IDs and decision metadata.

## G2-14-023-008 [P1] GAP facet F04
- Files: src/db/schema/placement-learner-general-requests.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/StudentRequest.java:53-55 — statuses PENDING/APPROVED/REJECTED/AUTO_APPROVED.
- Expected fix: Define AUTO_APPROVED vs CANCELLED compatibility.

## G2-14-023-047 [P1] GAP facet F22
- Files: src/db/schema/placement-learner-general-requests.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/StudentRequest.java:24-74 — student_request Long PK, numeric user/job/app, payload_json MySQL JSON, status AUTO_APPROVED.
- Expected fix: Write full legacy ID/type/status/payload/history migration map.

## G2-14-023-048 [P1] GAP facet F22
- Files: src/db/schema/placement-learner-general-requests.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/StudentRequest.java:69-70 — escalate_at persisted on request row.
- Expected fix: Add escalation tracking or map to specific job-request table.

## G2-15-028-050 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:26-70 — sprint rows keep key,dueLabel,releaseKey,goal,description.
- Expected fix: Write schema/data migration for dueLabel/key and release grouping.

## G2-18-024-007 [P1] GAP facet F04
- Files: src/db/schema/activity.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:21-60 — id, actorUserId/type/mobile, actionKey, entityType/Id, organizationId/collegeId, ip/userAgent/payloadJson, createdAt.
- Expected fix: Write field-level map for legacy IP/userAgent, actor type/mobile and payload.

## G2-18-024-052 [P1] GAP facet F22
- Files: src/db/schema/activity.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:21-60 — admin_audit_log BIGINT PK, numeric actor/scope, IP/UA, action/entity, JSON payload, createdAt.
- Expected fix: Create migration/crosswalk and audit IP/UA retention policy.

## G2-10-025-006 [P1] MISSING facet F02
- Files: src/app/(authenticated)/hr/colleges/page.tsx, src/app/(authenticated)/hr/home/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:175-224 — /colleges returns college summary + placement contact/branches.
- Expected fix: Restore Colleges view sections

## G2-10-002-080 [P1] GAP facet F22
- Files: src/db/schema/db10-announcements.ts, src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: Legacy MySQL placement_announcement BIGINT key nullable college scope one TPOS broadcast row `docs/legacy-source/backend/src/main/resources/db/migration/V210__placement_announcements.sql:6-19` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:379-386`
- Expected fix: Model stable broadcast group entity with target join or explicit parentId and test query parity

## G2-10-002-081 [P1] GAP facet F22
- Files: src/db/schema/db10-announcements.ts
- Legacy: Legacy recipient targeting join table placement_announcement_college keyed announcement and college `docs/legacy-source/backend/src/main/resources/db/migration/V217__announcements_audience_reach_schedule.sql:28-33`
- Expected fix: Provide broadcast-recipient relation or verified grouping equivalence across sender and targets

## G2-10-002-082 [P1] GAP facet F22
- Files: src/db/schema/db10-announcements.ts
- Legacy: Legacy reader table key announcement_id reader_type reader_id and read_at timestamp `docs/legacy-source/backend/src/main/resources/db/migration/V210__placement_announcements.sql:21-27`
- Expected fix: Define conversion of per-reader receipts into per-college first-read semantics for analytics

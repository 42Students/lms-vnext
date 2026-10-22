# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-003-034 [P1] GAP facet F10
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/db/schema/activity.ts, src/modules/activity/service.ts
- Legacy: Old audit action classified by actionKey and entityType from AdminAuditLog `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:34-41` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/AdminAuditLogRepository.java:84-105`
- Expected fix: Create crosswalk for every legacy action key and category before parity is claimed

## G2-10-003-066 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/db/schema/activity.ts
- Legacy: Legacy admin_audit_log BIGINT id actionKey entityType entityId actor type/id IP userAgent payload JSON createdAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/AdminAuditLog.java:10-60`
- Expected fix: Document schema mapping; add privacy-approved origin metadata or explicitly retire IP and user-agent reporting

## G2-10-004-049 [P1] GAP facet F10
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/modules/placements/admin-company-merge-service.ts
- Legacy: Legacy global merge moves domains jobs recruiters college notes aliases and marks old merged id `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:140-170`
- Expected fix: Specify safe migration for aliases/domains/private notes and multi-college merge; enforce explicit approval

## G2-10-004-055 [P1] GAP facet F12
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/modules/placements/admin-company-merge-service.ts
- Legacy: Legacy merges duplicate globally if two live companies and moves every college relation `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:140-170`
- Expected fix: Support approved platform-wide merge across colleges with transactional privacy preservation or document deliberate restriction

## G2-10-004-056 [P1] MISSING facet F12
- Verification: OK — matching implementation found in vNext.
- Files: src/modules/placements/admin-company-merge-service.ts
- Legacy: Legacy merges original company name into target alias for future search `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:158-166`
- Expected fix: Create canonical alias from merged identity and preserve source alias search

## G2-10-009-004 [P1] MISSING facet F01
- Verification: OK — matching implementation found in vNext.
- Files: src/app/(authenticated)/admin/inbound-mail/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:12-17` views To read / Posted to conversations / Done / All
- Expected fix: Restore Posted to conversations view backed by original routing outcomes; keep TRIAGED as extra if desired

## G2-10-013-047 [P1] GAP facet F12
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/modules/placements/college-drive-interviews-model.ts
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:251-275 — Legacy upcoming/completed/cancelled filtering depends on interviewStatus and scheduled time.
- Expected fix: Filter appointment status from slot/outcome rather than round status.

## G2-10-014-009 [P1] MISSING facet F03
- Verification: OK — matching implementation found in vNext.
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:147-159 — Close drive danger button and Open drive primary with Yes/No Popconfirm.
- Expected fix: Use context-specific lifecycle button.

## G2-10-015-019 [P1] GAP facet F05
- Verification: OK — matching implementation found in vNext.
- Files: src/modules/placements/college-drive-applications-model.ts, src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:112-119,373-415 — First open defaults Assessment tab and page 1, 20 rows.
- Expected fix: Route alias redirect to stage ASSESSMENT, use page size20.

## G2-10-019-008 [P1] GAP facet F02
- Verification: OK — matching implementation found in vNext.
- Files: src/app/(authenticated)/admin/module-access/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:605-615 — Overview metrics hierarchy scopes, largest learner count, student overrides.
- Expected fix: Calculate selected-college metrics only with hierarchy data.

## G2-10-020-105 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/modules/academics/program-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:175-195 — Physical delete semantics via old controller.
- Expected fix: Keep historical data with explicit UX decision and recovery flow.

## G2-10-029-055 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/db/schema/projects.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:223-235 — upsert DTO tasks embedded in mutable template object.
- Expected fix: Write explicit version migration and taskField compatibility map.

## G2-10-028-034 [P1] GAP facet F10
- Verification: OK — matching implementation found in vNext.
- Files: src/components/projects/project-archive-control.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:188-200 and docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:555-570 — POST /api/v1/admin/projects/:id/archive with collegeId query.
- Expected fix: Compare side effects and preserve new CAS guard.

## G2-10-028-056 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/db/schema/projects.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:306-323 — legacy numeric collegeId, ProjectWorkspaceDTO and five states.
- Expected fix: Write status/data migration map incl missing template.

## G2-10-023-045 [P1] MISSING facet F09
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Organizations.js:208-217 — Organization Edit modal; delete Popconfirm.
- Expected fix: Restore Edit and Delete modal/confirm paths

## G2-17-026-007 [P1] GAP facet F04
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/db/schema/activity.ts
- Legacy: Legacy classId, courseId, learnerId, courseSlug, courseName, deliveryStatus, scheduledAt, deliveryError; NotificationResponseDTO.java:16-47
- Expected fix: Create explicit mapping for class/course metadata and scheduled/delivery state; do not silently discard administrative visibility.

## G2-17-026-046 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/db/schema/activity.ts
- Legacy: Legacy notification integer key and class/course/learner ID, soft delete, creator, status; Notification.java:13-113
- Expected fix: Provide schema crosswalk and data model decision for broadcast, retention, schedule and staff ownership.

## G2-17-026-047 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/db/schema/activity.ts
- Legacy: Legacy class/course scope through joins, soft-delete older-than query; NotificationRepository.java:20-103,188-194
- Expected fix: Document retention job, scope indexes, and migration naming without assuming legacy table is copied.

## G2-19-024-045 [P1] GAP facet F21
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: (none, new feature)
- Legacy: Legacy DB insert + audit.bell; no queue/email for TPOS; PlacementAnnouncementService.java:379-388
- Expected fix: Specify reliable delivery/outbox and retry semantics; don't claim future notification happens without worker.

## G2-19-024-046 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/db/schema/db10-announcements.ts
- Legacy: Legacy placement_announcement single record + placement_announcement_college join + per-faculty placement_announcement_read; PlacementAnnouncementService.java:338-389,408-417
- Expected fix: Add broadcast grouping and composite unique recipient constraints; preserve distinct-cell read metrics.

## G2-19-024-047 [P1] GAP facet F22
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/db/schema/db10-announcements.ts
- Legacy: Legacy soft-delete boolean plus UTC sentAt, audience_kind/label/json/recipient_count; PlacementAnnouncementService.java:338-404
- Expected fix: Map old columns explicitly and migrations; store provenance and immutable targets for group updates.

## G2-11-002-069 [P1] GAP facet F13
- Verification: DEFERRED — requires deeper behavior, migration or scope validation before parity can be confirmed.
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: Partial refresh warning and Retry drive `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:210`
- Expected fix: Preserve partial data/retry

## G2-11-004-006 [P1] GAP facet F02
- Verification: OK — matching implementation found in vNext.
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: Main split `recruiter-plan-drive__form-column` and review aside `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:356`
- Expected fix: Reinstate two-column form/always-visible preview at desktop

## G2-11-004-028 [P1] GAP facet F05
- Verification: OK — matching implementation found in vNext.
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: Passing year multi-select tags, any year, e.g. 2027 `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:410`
- Expected fix: Support array of passing years, not one value

## G2-11-004-049 [P1] GAP facet F07
- Verification: OK — matching implementation found in vNext.
- Files: src/components/hr/hr-drive-draft-form.tsx
- Legacy: Server errors mapped to jobTitle, ctcLpa, minCgpa, passingYears `docs/legacy-source/frontend/src/pages/recruiter/drives/new.js:293`
- Expected fix: Map per-field API problem details into visible errors

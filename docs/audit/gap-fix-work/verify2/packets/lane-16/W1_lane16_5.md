# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-6-032-038 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: Legacy project resource uploads shared assignments folder allowed project active members, including learners depending caller (file-and-video-storage.md:14; FileUploadController.java:216-227).
- Expected fix: Resolve role-authoring parity for project resource files, separate from learner final-delivery submissions.

## G2-6-027-012 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Legacy org-active and target-visible separate lists; /all includes hidden status (JobController.java:108-125,162-169,187-224).
- Expected fix: Expose an authorized hidden/closed view only if legacy UX requires it, without leaking cross-tenant jobs.

## G2-6-019-028 [P1] GAP facet F10
- Files: src/modules/placements/candidate-preferences-service.ts
- Legacy: Legacy GET/PUT route, service upserts on first write with learner relation (LearnerProfileController.java:1177-1202; LearnerProfileServiceImpl.java:943-975).
- Expected fix: Clearly separate profile and placement preference persistence; avoid two sources of truth for common fields.

## G2-11-014-054 [P1] GAP facet F20
- Files: src/app/(authenticated)/tpo/home/page.tsx
- Legacy: Legacy loadInFlightRef serializes reads and retains old snapshot on failed refresh (home.js:28-47).
- Expected fix: Do not replace verified snapshot counts with 0 on source failure, use per-field last-good/unavailable.

## G2-11-023-005 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: Needs doing three conditional interactive chips incl Proof missing (RequestsPanel.js:120-124,418-427).
- Expected fix: Make proof-missing chip actionable and backend-grounded rather than advisory.

## G2-11-026-039 [P1] GAP facet F21
- Files: (none, new feature)
- Legacy: R2 presigned upload provider mandatory only for attachments (BugTrackerAttachmentService.java:27-35,183-190).
- Expected fix: Connect provider with fail-closed upload capability; no need to block issue create.

## G2-13-022-005 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Request includes payloadJson, learnerId, jobId nullable, applicationId nullable (StudentRequest.java:36-51).
- Expected fix: Support independent registration/PAP request kinds without application or explicit behavior change.

## G2-6-026-017 [P1] GAP facet F06
- Files: src/modules/placements/public-join/company-preview-policy.ts
- Legacy: Legacy company-domain check resolves among domains registered to linked company (CompanyJoinService.java:239-253).
- Expected fix: Support all verified domains for the company, not only a single primary domain.

## G2-6-025-005 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: Legacy file uploader ultimately shows publicUrl for uploaded Resource materials (PresignUploadResponseDTO.java:11-18).
- Expected fix: Provide authenticated per-file Open/download action instead of public URL.

## G2-6-030-029 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy edit cancel dirty snapshot confirmation, Discard edits to ‘name’? Your unsaved changes will be lost (LectureHalls.js:20-27,166-186).
- Expected fix: Add dirty form snapshot and precise Discard edits confirmation for Cancel, Escape, backdrop.

## G2-6-008-038 [P1] GAP facet F11
- Files: src/modules/activity/faculty-notifications-access.ts
- Legacy: Old faculty/learner recognized by isFacultyRole/isLearnerRole; redirects mismatched routes `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:349-377`
- Expected fix: Document visibility changes for mentor/admin faculty type and maintain correct role redirect

## G2-6-024-020 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Legacy for ack: invokes acknowledgeCallback with chat/message IDs and original text + ✅ Acknowledged (TelegramWebhookController.java:58-60).
- Expected fix: Persist state AND edit original message, keeping provider update consistent with durable triage.

## G2-12-027-042 [P1] GAP facet F13
- Files: (none, new feature)
- Legacy: LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:245-265: orphan data remains with metadataIncomplete=true and warning log.
- Expected fix: Display degraded data with icon/helper instead of dropping records silently.

## G2-14-030-015 [P1] MISSING facet F06
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:306-317 Interview Type required: SCREENING, TECHNICAL, HR, MANAGERIAL, FINAL.
- Expected fix: Restore type selection or map to per-round type with explicit lossless conversion.

## G2-15-025-051 [P1] GAP facet F21
- Files: (none, new feature)
- Legacy: LBE/controller/RecruiterCollegeController.java:84-101 TpoDriveService.createRequest/resubmit integrates college approval and notifications.
- Expected fix: Cross-check no-auto-publish behavior and approval policy; preserve TPO ownership.

## G2-17-031-018 [P1] GAP facet F06
- Files: src/modules/projects/project-resource-file-service.ts
- Legacy: LBE/controller/ProjectWorkspaceController.java:302-340 resource array update and protected download.
- Expected fix: Align URL, file type, upload size and visibility field rules in task/resource forms.

## G2-17-031-027 [P1] GAP facet F10
- Files: src/modules/projects/mentor-task-create-service.ts
- Legacy: LBE/controller/ProjectWorkspaceController.java:294-305 PUT entire tasks/resources section.
- Expected fix: Describe semantic change whole-array vs per-item and migrate optimistic tokens.

## G2-17-031-038 [P1] GAP facet F14
- Files: src/modules/projects/project-resource-file-service.ts
- Legacy: LBE/controller/ProjectWorkspaceController.java:310-340 authorized resource download.
- Expected fix: Check object signed URL expiry/size/mime/filename and tenant download access.

## G2-18-021-058 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/dto/response/JobImportantDateEventDTO.java:15 jobId numeric BIGINT, title/company snapshot from job.
- Expected fix: Map old integer job identity and company display snapshot into UUID job and relationships.

## G2-7-001-024 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:145-161: search matches displayed workspace name/title and mentor on the current page.
- Expected fix: Add tenant-safe mentor-name search in SQL before pagination.

## G2-7-002-076 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/model/AdminAuditLog.java:10-61: `admin_audit_log`: bigint id, actionKey varchar100, entityType60/entityId60, actorUserId integer/actorType20, IP/UA, JSON payload and LocalDateTime.
- Expected fix: Map legacy event codes/actor/subject metadata; decide retention of IP/UA and import backfill contract.

## G2-7-005-021 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/templates/[templateId].js:102-114,171-183: failed GET -> `Template could not be loaded` with API error and Retry button.
- Expected fix: Catch access/not found/database read separately; show legacy Retry and failure message.

## G2-7-007-054 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LBE/controller/AdminProjectController.java:839-866: dedicated resource-audit API returns ProjectResourceAudit list.
- Expected fix: Build typed audit adapter with actionType, resourceKey, actor role, changedFields, before/after, timestamp.

## G2-7-010-038 [P1] GAP facet F13
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:119-135: failed load alert with Retry, no stale edit form.
- Expected fix: Isolate meeting failure from unrelated workspace services, with retriable error.

## G2-7-013-006 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceResourcesEditor.jsx:42-61: inline repeating form, Save resource library footer
- Expected fix: Provide bulk edit + one scoped Save or fully equivalent multi-edit flow

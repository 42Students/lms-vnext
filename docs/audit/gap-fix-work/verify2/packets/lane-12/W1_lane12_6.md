# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-012-035 [P1] GAP facet F06
- Files: src/components/tpo/tpo-new-followup-modal.tsx
- Legacy: Legacy recruiter selection remote-searches globalSearch after 2 characters (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:55-71`)
- Expected fix: Use paged remote recruiter lookup with stale-response protection

## G2-5-012-037 [P1] GAP facet F06
- Files: src/components/tpo/tpo-new-followup-modal.tsx
- Legacy: Legacy When picker D MMM YYYY h:mm A at 5-minute increments (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:143-157`)
- Expected fix: Allow 5-minute selection and match display format

## G2-5-012-038 [P1] GAP facet F06
- Files: src/components/tpo/tpo-new-followup-modal.tsx
- Legacy: Legacy picker disallows past day and validates date-time strictly after now (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:143-157`)
- Expected fix: Apply future-time validation to all create paths, with exact field error

## G2-5-012-097 [P1] GAP facet F20
- Files: src/components/tpo/tpo-new-followup-modal.tsx
- Legacy: Legacy invalid future date prevented in datetime picker (`docs/legacy-source/frontend/src/components/tpo/FollowUpModal.jsx:143-156`)
- Expected fix: One validation schema for all flows and exact now boundary

## G2-5-032-005 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: Legacy operational log polls, daily and weekly digest behind scheduler. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:85-96`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogDigestService.java:139-158`
- Expected fix: Expose operator run status and last-success timestamps without a customer-facing page.

## G2-6-015-034 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: One application per learner+job (JobApplication.java:12-15).
- Expected fix: Document decision; enforce job+member unique if legacy cardinality retained.

## G2-6-019-046 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: Legacy nullable job pref columns can preserve partial updates (LearnerProfileServiceImpl.java:954-972).
- Expected fix: Prevent partial update from clearing omitted values, especially migration/sync.

## G2-11-020-052 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Stages facts INVITED/JOINED/DRIVE_PLANNED/RECRUITED; manual NEW/CONTACTED/NOT_NOW only (index.js:131-132,435-440).
- Expected fix: Preserve stage policy plus all legacy permitted manual actions, lock others.

## G2-11-026-029 [P1] MISSING facet F14
- Files: (none, new feature)
- Legacy: 3 max attachments per issue, PNG/JPEG/WebP, <=8MiB (BugTrackerAttachmentService.java:22-25,38-54,173-180).
- Expected fix: Enforce 3 attachments and 8MiB server side in uploader and confirm.

## G2-12-011-042 [P1] MISSING facet F21
- Files: (none, new feature)
- Legacy: Integrates tpo_audit_log, job, job_round, job_offer, job_application, drive_change_request, TpoMessagesService (RecruiterNotificationService.java:44-63,122-134).
- Expected fix: Wire equivalent producers/queries for omitted audit and message sources.

## G2-6-017-008 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy assigned_by nullable integer (ProjectTemplateCollege.java:26-27; V140__project_template_college_assignment.sql:11).
- Expected fix: Choose explicit system actor for historical unowned assignments; provide backward-compatible import fallback.

## G2-6-002-015 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Old Faculty Type badge maps enum to human-friendly case `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:22-28` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:784-791`
- Expected fix: Separate faculty-type enum label from membership Mentor role and render badge

## G2-6-002-017 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-scoped-people-service.ts
- Legacy: Old Active/Suspended badge derives faculty.suspendedAt `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:794-801`
- Expected fix: Define status mapping and avoid confusing global and scoped suspension

## G2-6-029-048 [P1] GAP facet F14
- Files: (none, new feature)
- Legacy: Legacy Export CSV downloads project-templates.csv; columns Title, Version, Lifecycle, Summary from current filtered table rows (templates/index.js:270-300).
- Expected fix: Restore filename and 4-column contract; decide filtered ALL vs current-page export explicitly.

## G2-6-008-029 [P1] GAP facet F08
- Files: src/app/(authenticated)/teacher/notifications/page.tsx
- Legacy: Old partial refresh fails with `Couldn't refresh notifications` and preserves prior list `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:664-671`
- Expected fix: Keep last fulfilled client data and show non-destructive partial error

## G2-12-027-031 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:121-129: DELETE physically removes assignment via repository.deleteById.
- Expected fix: Define explicit hard-delete vs end/deactivate policy and data retention; avoid calling end an exact delete match.

## G2-14-030-010 [P1] MISSING facet F04
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:277-299 reads rescheduleRequestJson.reason/note/windows.
- Expected fix: Store/project pending reason, note, windows or link to structured learner requests.

## G2-15-025-024 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LBE/controller/RecruiterCollegeController.java:71-75 calls requireCollege capability COLLEGE_OVERVIEW then overview service.
- Expected fix: Add scoped non-identifying demographic query returning legacy fields.

## G2-17-031-040 [P1] GAP facet F14
- Files: (none, new feature)
- Legacy: LBE/controller/ProjectWorkspaceController.java:341-415 delivery evidence.
- Expected fix: Verify multi-file/link/text acceptance and attachment replay/removal behavior.

## G2-19-027-098 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/Courses.js:578-639 has student visibility Show/Hide bulk controls selected across pages.
- Expected fix: Make bulk visibility reachable to college admins under same role policy and preserve selection/partial failures.

## G2-7-002-054 [P1] GAP facet F14
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/audit/index.js:559-581: `project-audit-log.csv` with Action, Entity type, Entity ID, Actor, When.
- Expected fix: Restore exact five headers and raw action/entity/actor/when mapping.

## G2-7-004-075 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:590-640: explicit note releases are context only; they never block submission.
- Expected fix: Priority owner decision: correct vNext gate; separate informational release metrics.

## G2-7-007-034 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LBE/model/ProjectResourceAudit.java:38-51: resource_order, before_json, after_json, changed_fields retained for granular evidence.
- Expected fix: Expose before/after diff and changed fields through authorized resource audit projection.

## G2-7-010-019 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:64-80: submit only `meetingsList` and `meetingsToken` with fresh sibling data.
- Expected fix: Implement comparable optimistic concurrency/version protection on multi-edit workflow.

## G2-7-012-035 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: ProjectReadinessDTO.java:14-19 explicit releases informational, not submission gate
- Expected fix: Remove release gate or record explicit business decision

## Lane-3 FINAL verification triage (2026-10-22)

- OK: G2-5-012-035, G2-5-012-037, G2-5-012-038, G2-5-012-097. TPO follow-up modal uses paged, abortable two-character recruiter lookup, explicit 5-minute input increments, IST legacy display formatting, and a future-time/step boundary before saving.
- DEFERRED: G2-5-032-005, G2-6-015-034, G2-6-019-046, G2-11-020-052, G2-11-026-029, G2-12-011-042, G2-6-017-008, G2-6-002-015, G2-6-002-017, G2-6-029-048, G2-6-008-029, G2-12-027-031, G2-14-030-010, G2-15-025-024, G2-17-031-040, G2-19-027-098, G2-7-002-054, G2-7-004-075, G2-7-007-034, G2-7-010-019, G2-7-012-035. These require deeper service, migration, permission, and end-to-end verification; no implementation parity claimed.

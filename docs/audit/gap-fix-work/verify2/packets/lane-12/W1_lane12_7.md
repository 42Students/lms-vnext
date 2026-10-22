# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-7-013-080 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:70-85: reversible unsaved remove; every edited item saved together
- Expected fix: Restore atomic multi-edit user journey or mark owner-approved reduction

## G2-7-015-014 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:48-52 derived progress = rounded(doneTasks+doneSprints)/(totalTasks+totalSprints), fall back stored progress
- Expected fix: Compute legacy progress in snapshot independently of hand-set percent

## G2-7-016-011 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:25-34 submissions from resolvedTasks with truthy submissionUrl
- Expected fix: Project latest evidence per task into submissions counter

## G2-7-017-019 [P1] MISSING facet F05
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:50-60,80-95 search member name or ID; type All members/Learners/Faculty
- Expected fix: Add search by name/member ID and role filter

## G2-7-018-008 [P1] MISSING facet F03
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:106-137 each row Workspace, Mentor and Restore action with UndoOutlined
- Expected fix: Recreate 3 columns and Undo icon/button

## G2-7-019-049 [P1] MISSING facet F10
- Files: src/app/(authenticated)/college/projects/page.tsx
- Legacy: workspaces/index.js:348-350 bulk reassignment and deleted list navigation
- Expected fix: Expose both routes directly in page head.

## G2-7-035-005 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: overview.js:153-156 templateId accepts old numeric/slug
- Expected fix: Map legacy template identifiers to UUID before 404

## G2-8-031-021 [P1] GAP facet F05
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/tracker/logs.js:310-343 older cursor for cloud logs, :265-310 newer refresh, grouped list.
- Expected fix: Implement paginated known-error history or default to primary cloud-log paginated explorer.

## G2-8-031-037 [P1] GAP facet F10
- Files: src/modules/activity/service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:84-149 searchByCategory uses AdminAuditLogRepository; joins old logs from mutation controllers.
- Expected fix: Inventory all old audit event producers and ensure every high-impact mutation emits equivalent typed event.

## G2-8-031-051 [P1] GAP facet F15
- Files: src/modules/activity/service.ts, src/db/schema/activity.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:47-80 logRequired aims not to fail domain mutation on audit write; notify/email independent.
- Expected fix: Decide critical vs best-effort audit policy, ensure rollback safety and no lost sensitive audit on mutation failure.

## G2-11-024-014 [P1] MISSING facet F06
- Files: src/app/(authenticated)/tpo/settings/rules/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/tpo/settings.js:392-405 CGPA percentage rule Select and Change
- Expected fix: Restore mutable college CGPA conversion control.

## G2-11-030-026 [P1] GAP facet F10
- Files: src/modules/admin-ui/super-admin-placement-applications-service.ts
- Legacy: 21-33 calls getAdminJobApplications, getInterviewsForApplication, rescreen, offer-letter and notes endpoints
- Expected fix: Map all legacy mutation/read closures including interview actions, notes and offers.

## G2-11-030-049 [P1] GAP facet F22
- Files: src/modules/admin-ui/super-admin-placement-applications-service.ts
- Legacy: 49-55 old numeric job/application IDs and old status/action histories
- Expected fix: Define enum/foreign-key mapping, historical status and screening equivalence.

## G2-15-026-010 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-placement-applications-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-46 applicationStatus/appliedAt/statusUpdatedAt/statusUpdatedBy
- Expected fix: Expose status-change timestamp and actor in applicant details; preserve pipeline stage semantics

## G2-15-026-011 [P1] GAP facet F04
- Files: src/modules/admin-ui/super-admin-placement-applications-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:88-133 notes, rejectionReason, offerLetterUrl, screeningScore, isPartialScore, version
- Expected fix: Show scored/review and rejection/offer details with authorized masking, mark partial scores

## G2-15-026-015 [P1] GAP facet F05
- Files: src/modules/admin-ui/super-admin-placement-applications-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:931-975 org-wide application list with bounded pagination
- Expected fix: Add safe global/org application listing with right tenant scope, compare default sort descending legacy service

## G2-8-003-021 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/contacts/page.tsx
- Legacy: `.../PeopleDirectory.js:37-38`: when no valid collegeId, `Select a college to browse contacts` warning
- Expected fix: Match no-college warning in each context; retain Super Admin safe global mode only with explicit policy

## G2-8-025-037 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy rejects .. and // traversal, key must embed exact org+college IDs (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:109-115).
- Expected fix: Add CHECK/prefix or signing-service verification that key belongs to content college.

## G2-8-024-042 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: Legacy capability set on grant can be changed, unknown values rejected (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterAdminService.java:523-532; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:136-146).
- Expected fix: Define precise capability migration and effective runtime permission enforcement.

## G2-8-022-009 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Legacy id Long identity, collegeId Integer (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/PlacementSeason.java:33-38).
- Expected fix: Create stable season and college ID mapping for historical jobs and links.

## G2-9-002-020 [P1] MISSING facet F05
- Files: src/app/(authenticated)/college/batch-promotion/page.tsx
- Legacy: Ant Table 10 rows per page with size changer and total range (`docs/legacy-source/frontend/src/pages/superadmin/sections/BatchPromotion.js:440-451`)
- Expected fix: Restore 10-row batch pagination, size selector, range summary.

## G2-9-007-068 [P1] GAP facet F19
- Files: src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/admin/electives/OfferingRosterDrawer.jsx:24-40` — Roster state query is refetched; 50 rows/page
- Expected fix: Add cursor paging for large rosters

## G2-9-015-097 [P1] GAP facet F21
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:3-24` — Jobs integrates StudentPlacementLookup, JobForm, job status, delete impact, draft list.
- Expected fix: Reconnect JobForm and StudentPlacementLookup to list.

## G2-9-012-047 [P1] GAP facet F13
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:780-788` — Error alert with dismiss independent of data
- Expected fix: Add explicit retry for appointment/round read errors

## G2-9-014-004 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/shortlisted.js:20-31` — No-college assignment warning describes how to contact administrator.
- Expected fix: Display explicit unassigned college recovery message.

## Lane-12 fast verification triage (2026-10-22)

Confirmed via cited vNext code (OK, limited to described behavior): G2-7-019-049, G2-9-002-020.

DEFERRED — deeper implementation/API/migration review required; these are NOT verified or fixed: G2-7-013-080, G2-7-015-014, G2-7-016-011, G2-7-017-019, G2-7-018-008, G2-7-035-005, G2-8-031-021, G2-8-031-037, G2-8-031-051, G2-11-024-014, G2-11-030-026, G2-11-030-049, G2-15-026-010, G2-15-026-011, G2-15-026-015, G2-8-003-021, G2-8-025-037, G2-8-024-042, G2-8-022-009, G2-9-007-068, G2-9-015-097, G2-9-012-047, G2-9-014-004.
This packet has been triaged, not certified parity-complete; no unverified row is claimed OK.

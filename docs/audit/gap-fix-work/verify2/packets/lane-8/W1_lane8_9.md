# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-15-024-026 [P1] GAP facet F23
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: Legacy explicitly opt-in APP_E2E_SEED_ENABLED in each deployment; no Spring profile gate (SuperAdminE2eController.java:26-36).
- Expected fix: Preserve defense in depth, forbid prod seeding, document manual setup if intentionally retired.

## G2-6-002-071 [P1] MISSING facet F15
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/app/(authenticated)/admin/faculty/page.tsx
- Legacy: Old clear OTP lockout calls admin utility and shows toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:561-570`
- Expected fix: Add admin-only OTP reset with audit and rate limiting controls

## G2-6-007-001 [P1] MISSING facet F01
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/app/(authenticated)/teacher/layout.tsx
- Legacy: Legacy GET `/teacher` checks auth cookie then redirects to `/teacher/courses` `docs/legacy-source/frontend/src/pages/teacher/index.js:1-7`
- Expected fix: Create `src/app/(authenticated)/teacher/page.tsx` redirect `/teacher/courses` for permitted faculty

## G2-12-027-017 [P1] GAP facet F06
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LBE/dto/request/FacultyTeachingAssignmentDTO.java:14-35: numeric faculty/course/class/batch/semester @Min(1), academicYear/role max255, isActive, startDate, endDate, courseIds.
- Expected fix: Restore editable academic-year/lifecycle details or explicitly preserve through linked period and migration strategy.

## G2-13-023-049 [P1] GAP facet F22
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LBE/service/tpo/TpoScheduleService.java:319-336 uses round_assignment and reschedule_request (round_id, application_id, reason, preferred_times, status).
- Expected fix: Write migration field/status map for legacy requests and booking confirmations.

## G2-14-030-054 [P1] GAP facet F22
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LBE/model/Interview.java:52-58 includes RESCHEDULE_REQUESTED and CONFIRMED statuses.
- Expected fix: Represent CONFIRMED and pending reschedule separately or document status remapping.

## G2-17-031-024 [P1] GAP facet F09
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LFE/pages/mentor/projects/[projectId].js:8-15 Create Task, Add Member, Schedule Meeting and Review Submission must not close when tab changes.
- Expected fix: Maintain stable modal state across selectedTab changes with dirty-confirm.

## G2-19-027-091 [P1] GAP facet F21
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/Courses.js:217-228 uses R2 presigned upload helper for course image.
- Expected fix: Connect storage receipt flow or document intentional deferral and render fallback.

## G2-7-002-026 [P1] GAP facet F05
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/audit/index.js:101-113: range options today/7d/30d/all, today default; short ranges wide=200.
- Expected fix: Restore short-range 200 read limit or clearly retain new pagination with trustworthy counts.

## G2-7-004-048 [P1] GAP facet F12
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:330-341: force-override column displays active Boolean read from ProjectReadinessDTO.
- Expected fix: Prove event stream authoritative vs persisted readiness fields, and handle missing/pre-migration events.

## G2-7-007-022 [P1] GAP facet F07
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceResourceAudit.jsx:135-145: audit fetch failure shows `Resource audit could not be loaded`, server reason and Retry.
- Expected fix: Add isolated audit initial-fetch error and exact retry action.

## G2-7-010-005 [P1] GAP facet F02
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:61-82: inline RepeatingItemEditor plus Save meeting plan footer.
- Expected fix: Restore inline bulk editor and single Save action (or equivalent multi-edit workflow).

## G2-7-011-061 [P1] GAP facet F17
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61: guards keyboard Back/Forward and app tab navigation on dirty form.
- Expected fix: Implement focus-safe confirm for dirty Cancel, tabs and browser unload.

## G2-7-013-070 [P1] GAP facet F19
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:250-276: bulk section 500 cap
- Expected fix: Clarify supported large workspaces and prevent editor dead end

## G2-7-015-005 [P1] GAP facet F02
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:474-500 header actions Change template…, Archive, Delete
- Expected fix: Expose template attachment and recoverable Delete with proper guard

## G2-7-015-080 [P1] GAP facet F22
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LFE/model/ProjectWorkspace.java:19-125 `project_workspace` INT PK, global slug, status VARCHAR40, progress INT, classId, version, fields
- Expected fix: Field-by-field legacy-to-vNext migration and status mapping required

## G2-7-017-007 [P1] GAP facet F02
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceTeamOverview.jsx:88-100 TeamGroupNotice then Team roster Card with table
- Expected fix: Rebuild team-group alert and role/activity roster table

## G2-7-017-081 [P1] GAP facet F22
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LBE/dto/projects/AdminProjectLearnerAssignDTO.java:9-18 learnerIds list max500 and replaceExisting default true backend; Team modal sets false default
- Expected fix: Align effective form default and endpoint max500, add append semantic option

## G2-7-018-068 [P1] GAP facet F22
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: LBE/controller/AdminProjectController.java:340-355 deleted page endpoint returns PageDTO; restoreProject Java service separate from archive
- Expected fix: Separate archived lifecycle and soft-deleted restore semantics in schema/service

## G2-7-034-019 [P1] MISSING facet F10
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: SuperAdminTemplateShell.jsx:49-51 Use this template routes /superadmin/projects/workspaces/new?templateId={numeric}
- Expected fix: Restore create-from-template route with safe UUID preselection

## G2-8-021-059 [P1] GAP facet F20
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: (none, new feature)
- Legacy: Legacy revoked absence row retained with is_deleted true and revision clock, permitting reactivation (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerServiceImpl.java:570-602,635-645).
- Expected fix: Ensure audit log is sufficient for disputes and provide previous marker/reason in history.

## G2-8-031-019 [P1] GAP facet F05
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/modules/placements/tpo-audit-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/tpo/audit.js:44-52 default 500 events, date range up to 5000, header x-total-count, filters apply client-side.
- Expected fix: Implement complete bounded date-range export with total count and explicit truncation warnings.

## G2-8-031-069 [P1] GAP facet F22
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/modules/placements/tpo-audit-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/tpo/audit.js:17-18 entityType category covers DRIVES, RECRUITER_LEAD, STUDENT, OFFER, ROUND, SHARE, SETTINGS, BULK.
- Expected fix: Define deduplication/union ordering contract so one mutation appears once with correct actor/details, no omissions.

## G2-11-021-001 [P1] GAP facet F01
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/app/(authenticated)/tpo/reports/[slug]/page.tsx, src/app/(authenticated)/tpo/reports/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:29-35 routes any REPORTS name dynamically
- Expected fix: Restore aliases for all legacy report names including outcomes and recruiter-leads

## G2-14-031-002 [P1] GAP facet F01
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/modules/academics/college-mapping-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:31-34,104-106 semester page/actions per program
- Expected fix: Expose program semester number and equivalent course mapping entry point

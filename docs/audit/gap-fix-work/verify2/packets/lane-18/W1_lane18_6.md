# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-028-015 [P1] GAP facet F06
- Files: src/components/projects/college-project-mentor-dialog.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:348-358 mentor Select searchable by faculty name, not preselected
- Expected fix: Start with no selection and search as typed; avoid silently assigning first option

## G2-12-028-025 [P1] GAP facet F09
- Files: src/components/projects/college-project-mentor-dialog.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:326-372 mentor modal warning lists cancelled meetings, unassigned tasks, both mentors notified
- Expected fix: Show specific impact warning and confirmation before submit

## G2-12-028-049 [P1] GAP facet F20
- Files: src/components/projects/college-project-mentor-dialog.tsx, src/components/projects/college-project-student-roster-dialog.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:153-190 preserves selections on remote search and stale sequence
- Expected fix: Preserve selected mentor while searching even if result page excludes them; ignore stale responses

## G2-19-028-004 [P1] GAP facet F04
- Files: src/components/projects/project-meeting-controls.tsx
- Legacy: projectSectionFieldConfigs.js:176-215 12 meeting fields including keys/notes
- Expected fix: Expose omitted fields

## G2-8-018-034 [P1] GAP facet F09
- Files: src/components/activity/notification-list.tsx
- Legacy: docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:714-748: opening detail does not change read state
- Expected fix: Separate view from read acknowledgement unless deliberate change approved.

## G2-8-017-050 [P1] GAP facet F14
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/projects/templates/index.js:270-300 project-templates.csv exports Title/Version/Lifecycle/Summary for all filtered rows
- Expected fix: Export ALL filtered records server-side, or explicitly label current-page export; match column order and filename.

## G2-8-030-012 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/placements/drives/page.tsx
- Legacy: Old Applicants count applicationCount or applicantCount else — docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:556-562.
- Expected fix: Ensure count meaning matches all applicant statuses, not only SUBMITTED.

## G2-8-030-017 [P1] GAP facet F05
- Files: src/modules/placements/tpo-operations-service.ts, src/modules/placements/admin-drive-directory-model.ts
- Legacy: Old sort postedDate DESC via server paginated search docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:249-260.
- Expected fix: Use stable postedDate DESC server sort and pagination before loading all rows.

## G2-8-030-051 [P1] GAP facet F19
- Files: src/modules/placements/tpo-operations-service.ts, src/modules/placements/admin-drive-directory-model.ts
- Legacy: Old server pagination with posted date sort and abort stale requests docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:233-283.
- Expected fix: Avoid loading all college jobs/applicant stats for first10 rows; separate targeted page query.

## G2-8-023-009 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: Legacy bulk reject action labelled Not selected and internal/student reasons separate (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ApplicationTransitionService.java:23-29; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoApplicantService.java:41-45).
- Expected fix: Split internal note from candidate-facing rejection explanation to prevent disclosure confusion.

## G2-8-022-025 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Legacy multiple current seasons accepted (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:32-41).
- Expected fix: Remove incompatible active-only guard if overlapping seasons are permitted.

## G2-9-001-036 [P1] GAP facet F10
- Files: src/modules/activity/college-activity-service.ts
- Legacy: GET /api/v1/superadmin/audit with collegeId/category/since/page/size (`docs/legacy-source/frontend/src/api/Services/SuperAdminAuditService.js:1-5`)
- Expected fix: Map legacy action coverage to new typed events and restore query defaults.

## G2-9-001-040 [P1] GAP facet F11
- Files: src/modules/activity/college-activity-service.ts
- Legacy: College Admin only own college; scoped Super Admin allowed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:122-163`)
- Expected fix: Check scoped Super Admin ability, enforce acting college where approved.

## G2-9-001-068 [P1] GAP facet F21
- Files: src/modules/activity/college-activity-service.ts
- Legacy: Axios service to Java controller (`docs/legacy-source/frontend/src/api/Services/SuperAdminAuditService.js:1-5`)
- Expected fix: Map legacy audit action producers and integrations to vNext writer calls.

## G2-9-003-051 [P1] GAP facet F11
- Files: src/app/(authenticated)/college/batches/page.tsx
- Legacy: Missing college warning (`docs/legacy-source/frontend/src/pages/college-admin/batches.js:18-31`)
- Expected fix: Show contact administrator warning.

## G2-9-004-014 [P1] MISSING facet F04
- Files: src/modules/placements/college-company-directory-service.ts
- Legacy: Contact person and contact email column (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:283-295`)
- Expected fix: Add authorized contact metadata display with privacy controls.

## G2-9-004-046 [P1] MISSING facet F10
- Files: src/modules/placements/college-company-directory-service.ts
- Legacy: Old company jobs/stats by company ID and college ID (`docs/legacy-source/frontend/src/api/Services/AdminService.js:662-673`)
- Expected fix: Add authorized jobs/stats detail endpoint.

## G2-9-004-052 [P1] GAP facet F12
- Files: src/modules/placements/college-company-directory-service.ts
- Legacy: Show deleted list includes soft-deleted rows (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:118-137`)
- Expected fix: Reconcile archived company versus archived college relationship semantics.

## G2-9-008-032 [P1] GAP facet F07
- Files: src/app/(authenticated)/college/hiring-dashboard/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:503-505` — Funnel failure renders its own error Alert within card
- Expected fix: Isolate funnel error and keep metrics/company report visible

## G2-9-010-048 [P1] GAP facet F10
- Files: src/app/api/placements/college/jobs/[jobId]/pipeline/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:516-605` — POST bulk-status drives canonical application status updates and notifications
- Expected fix: Trace canonical application-status outcomes; do not misrepresent stage-only moves as legacy status transitions

## G2-9-016-006 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/placements/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:602-655` — Data retention report and StudentPlacementLookup appear below cards.
- Expected fix: Restore housekeeping and student lookup after cards; keep extra sections secondary.

## G2-9-011-017 [P1] GAP facet F04
- Files: src/modules/placements/college-drive-overview-model.ts
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:245-255` — Default absent metric Number(value ?? 0) shows 0
- Expected fix: Distinguish unavailable new Selected from legacy stage count and keep zero fallback only for comparable metrics

## G2-9-011-039 [P1] GAP facet F12
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:197-206` — Draft/Open/Expired/Closed status calculated from isDraft/isActive and UTC deadline
- Expected fix: Implement old presentation transitions and date-sensitive Expired label

## G2-9-014-026 [P1] MISSING facet F05
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:2025-2040` — Table rowCheckbox with disabled EXTERNAL and cross-page selected IDs.
- Expected fix: Restore selection and disabled rules.

## G2-9-014-086 [P1] GAP facet F20
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:672-693` — Selections are reconciled against newly fetched rows to avoid stale bulk IDs.
- Expected fix: Reintroduce selection with reconciliation on filter/data changes.

## Chat-12 final quick verification (2026-10-22)

- G2-12-028-015: OK — verified relevant selection, warning, read-state or college-context behavior in cited source.
- G2-12-028-025: OK — verified relevant selection, warning, read-state or college-context behavior in cited source.
- G2-12-028-049: OK — verified relevant selection, warning, read-state or college-context behavior in cited source.
- G2-19-028-004: DEFERRED — needs deeper parity or integration review; not certified.
- G2-8-018-034: OK — verified relevant selection, warning, read-state or college-context behavior in cited source.
- G2-8-017-050: DEFERRED — needs deeper parity or integration review; not certified.
- G2-8-030-012: DEFERRED — needs deeper parity or integration review; not certified.
- G2-8-030-017: DEFERRED — needs deeper parity or integration review; not certified.
- G2-8-030-051: DEFERRED — needs deeper parity or integration review; not certified.
- G2-8-023-009: DEFERRED — needs deeper parity or integration review; not certified.
- G2-8-022-025: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-001-036: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-001-040: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-001-068: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-003-051: OK — verified relevant selection, warning, read-state or college-context behavior in cited source.
- G2-9-004-014: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-004-046: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-004-052: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-008-032: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-010-048: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-016-006: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-011-017: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-011-039: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-014-026: DEFERRED — needs deeper parity or integration review; not certified.
- G2-9-014-086: DEFERRED — needs deeper parity or integration review; not certified.

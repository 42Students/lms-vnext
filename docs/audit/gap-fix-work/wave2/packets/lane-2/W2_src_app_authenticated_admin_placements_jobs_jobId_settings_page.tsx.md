# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-settings.md

## G2-10-014-001  [P2] MISSING  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:112-122; docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:6-11 — Four DriveSubNav tabs, active Settings, parent Drives breadcrumb.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:20-23 — Only PageHeader Settings and Drive overview back link; no four tabs.
- Fix: Restore legacy-facing behavior through selected-college-scoped services.

## G2-10-014-027  [P2] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:147-158 — Exact Popconfirm 'Are you sure you want to close/open this drive?', Yes/No.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:24-29 — No lifecycle confirmation.
- Fix: Restore legacy-facing behavior through selected-college-scoped services.

## G2-10-014-039  [P2] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:147-158 — Status change small Popconfirm attached to button.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:24-71 — No status modal.
- Fix: Restore legacy-facing behavior through selected-college-scoped services.

## G2-10-014-042  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:31-53 — Independent GET job and hiring metrics via Promise.allSettled; count failure not fatal.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:17-18; src/components/placements/super-admin-drive-archive.tsx:18-32 — Job GET only; archive preview count fetched on demand.
- Fix: Show count independently.

## G2-10-014-053  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:123-127 — Centered Spin padding40; load Alert with Retry.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:14-23 — App Router loader shape directory, no inline retry.
- Fix: Restore legacy-facing behavior through selected-college-scoped services.

## G2-10-014-056  [P2] GAP  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:689-700 — Rich HTML description/responsibilities, no upload in page.
- vNext now: src/components/placements/super-admin-published-drive-edit.tsx:60-61; src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:37-63 — Plain description, read-only legacy HTML details.
- Fix: Preserve legitimate formatted content.

## G2-10-014-060  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:145-159,164-192 — Small Ant status card and red Danger zone card, stacked.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:20-71 — Border-separated sections and collapsible More actions.
- Fix: Clone card/panel/red header geometry.

## G2-10-014-062  [P2] MISSING  facet F17  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:1092-1137 — Custom Rule label/value input aria-labels and last-row tooltip.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:57-60 — Read-only list, no keyboard editing.
- Fix: Restore accessible add/remove rows.

## G2-10-014-065  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:145-155 — Exact 'Drive status' card and 'Close drive'/'Open drive' button.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:24-29 — Only uppercase enum badge with 'Status:' label.
- Fix: Match title and button copy.

## G2-10-014-066  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:164-190 — Danger zone and Delete drive with quoted job title in Popconfirm.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:65-71; src/components/placements/super-admin-drive-archive.tsx:43-63 — More drive actions and Delete without danger styling.
- Fix: Match label prominence and punctuation.

## G2-10-014-068  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/settings.js:37-49 — Job and metrics concurrent with allSettled.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:17-18 — Single job fetch; count deferred.
- Fix: Restore legacy-facing behavior through selected-college-scoped services.

## G2-10-014-077  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:20-52,119-131 — Job keyed int, isDraft/isActive flags, organization/college fields.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx:18-27 — UUID, normalized company/season, enum status.
- Fix: Record every legacy status/field projection.

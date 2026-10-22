# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-5-010-077 [P1] GAP facet F22 Data/migrations
- Files: (none, new feature)
- Legacy: Hard delete class after no dependencies (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:225-255)
- Expected fix: Document persistence/retention semantics and migration.

## G2-5-018-025 [P1] GAP facet F10
- Files: src/modules/projects/activity-service.ts
- Legacy: Legacy per-project repository queries by projectId direct column `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectActivityEventRepository.java:15-53`
- Expected fix: Prove every imported activity has consistent project subject/metadata; otherwise silently missing.

## G2-5-018-049 [P1] MISSING facet F23
- Files: src/modules/projects/activity-service.ts
- Legacy: Legacy has frozen actor name,type and readable title/sourceTab `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:28-46`
- Expected fix: Preserve historical display metadata or explicitly authorize retirement.

## G2-5-019-014 [P1] GAP facet F04
- Files: src/modules/people/college-student-detail-service.ts
- Legacy: Legacy classId and programId direct on row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:49-56`
- Expected fix: Map correct active class, cohort and semester, not just current row.

## G2-5-031-011 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx
- Legacy: Legacy columns Name, Role, Mobile, Email, Org, College, Enabled, Sessions, Actions. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:295-301`
- Expected fix: Restore mobile and organization context in scoped admin table.

## G2-6-020-058 [P1] MISSING facet F23
- Files: (none, new feature)
- Legacy: Legacy optional chair/vice fields persisted even though UI may no longer expose them (Department.java:17-20).
- Expected fix: Record owner decision about leadership data parity; only add fields if still required in vNext.

## G2-6-019-018 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: Legacy fields update with PATCH-like non-null semantics (LearnerProfileServiceImpl.java:943-975).
- Expected fix: Prevent stale client section write overwriting separately updated fields; use per-section CAS/merge.

## G2-11-020-025 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Status filter LEAD, INVITED, JOINED (index.js:74-83).
- Expected fix: Match exact status buckets, keep unsubscribed as separate opt-in extra filter.

## G2-11-026-012 [P1] MISSING facet F06
- Files: (none, new feature)
- Legacy: Confirm storageKey<=700, originalFilename<=255 nonblank (BugTrackerAttachmentConfirmRequest.java:9-16).
- Expected fix: Add protected confirmation contract, verify key ownership and metadata.

## G2-12-011-019 [P1] GAP facet F08
- Files: (none, new feature)
- Legacy: Legacy refresh failure keeps last feed + PanelPartial 'Showing the last notifications we loaded.' (RecruiterNotificationBell.jsx:76-81,123-133).
- Expected fix: Preserve last-good private feed on recoverable network errors, but clear on 401/403.

## G2-15-024-024 [P1] MISSING facet F21
- Files: (none, new feature)
- Legacy: SeedResult returns stable E2E login phones with faculty/learner/admin roles (E2eSeedService.java:303-307).
- Expected fix: Provision test users plus memberships; limit to sandbox numbers.

## G2-6-002-058 [P1] MISSING facet F11
- Files: src/app/(authenticated)/admin/faculty/page.tsx
- Legacy: Old superadmin impersonation shown only when target not suspended `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:856-876`
- Expected fix: Restore guarded role/session state checks if support impersonation needed

## G2-6-006-018 [P1] MISSING facet F11
- Files: (none, new feature)
- Legacy: Old route could be visited by anyone but then forwards to courses (authorization applied there) `docs/legacy-source/frontend/src/pages/teacher/fileExplorer.js:1-8`
- Expected fix: Preserve old bookmarks independent of session validity; target handles failures

## G2-12-027-011 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: LBE/model/FacultyTeachingAssignment.java:33-53: raw batchId, semesterNumber, academicYear and SQL DATE start/end separately persisted.
- Expected fix: Document migration projections and historical start/end date conversion; preserve year and batch semantics.

## G2-13-023-032 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LBE/service/tpo/TpoScheduleService.java:346-357 excludes non-open application statuses and non-PUBLISHED job.
- Expected fix: Add legacy completed/withdrawn/cancelled drive visibility exclusion mapping to new status model.

## G2-14-030-051 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LFE/pages/superadmin/sections/InterviewEditForm.js:168-172 local date/time converted to UTC ISO string.
- Expected fix: Resolve local timezone correctly and persist offset-aware ISO without hardcoded offset.

## G2-17-031-021 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LBE/controller/AdminProjectController.java:198-242 per-team preflight and write errors.
- Expected fix: Report duplicate slug, stale roster and conflict individually in bulk error report.

## G2-19-027-087 [P1] GAP facet F20
- Files: (none, new feature)
- Legacy: LBE/model/Course.java:52-61 @Version optimistic CAS prevents lost updates including whole metaData.
- Expected fix: Add expectedUpdatedAt/version in PATCH and stale-conflict message to prevent overwriting form edits.

## G2-7-002-025 [P1] MISSING facet F05
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/audit/index.js:349-381: clicking Entity slug filters list to that exact entity, keyboard accessible.
- Expected fix: Make entity cell/button set subjectId and reset page; keep it URL-shareable.

## G2-7-004-008 [P1] GAP facet F02
- Files: src/components/projects/project-workspace-readiness.tsx
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:512-721: selected workspace expands Current readiness, Releases, Manual override stacked cards.
- Expected fix: Integrate detail panel in group page and preserve selected workspace context.

## G2-7-004-045 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:574-628: releases context only and explicitly do NOT influence readiness gate.
- Expected fix: Remove release count/shipping from readiness gating; use task and sprint completion, respecting submission state and override.

## G2-7-007-021 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:90-98: failure of workspace summary shows warning and retry, audit data remains available.
- Expected fix: Fetch workspace summary and resource audit independently; show partial warning with usable audit history.

## G2-7-010-004 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:39-60: Meeting plan Card, Team cadence eyebrow/headline, help paragraph, four metrics.
- Expected fix: Recreate Card, intro and four metric cells before editor.

## G2-7-011-048 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:67-69,93-106: untouched overview fields preserved and empty goal supported.
- Expected fix: Preserve extension keys or migrate/whitelist with explicit loss audit.

## G2-7-013-064 [P1] GAP facet F17
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/useUnsavedFormGuard.js:31-61: keyboard route Back guarded for changed form
- Expected fix: Guard keyboard/browser/tab navigation on dirty dialogs

## Lane-16 FAST verification triage (2026-10-22)

DEFERRED — all 25 rows require service, authorization, migration or multi-screen behavior verification beyond a quick source inspection. No parity or completed fixes claimed for these rows; retain each gap for detailed follow-up.

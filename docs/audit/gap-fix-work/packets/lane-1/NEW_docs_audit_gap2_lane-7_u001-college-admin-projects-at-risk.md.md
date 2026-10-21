# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u001-college-admin-projects-at-risk.md

14 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u001-college-admin-projects-at-risk.md

## G2-7-001-002  [P1] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:64-83: restores and writes URL `filter` and `search`.
- vNext now: V/modules/projects/admin-risk-query-model.ts:9-31: accepts only `riskBucket` and `q`; rejects old keys.
- Fix: Migrate bookmarked old query parameters while preserving filter state.

## G2-7-001-019  [P1] GAP  facet F05  effort L
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:218-278: Workspace/Mentor/Status/Severity/Risk reasons/Inactive/Blocker/Actions columns in order.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:110-183: stacked articles, no column headers.
- Fix: Render full eight-column table, not an article feed.

## G2-7-001-021  [P1] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:236-240: severity sort defaults to descending reason count.
- vNext now: V/modules/projects/admin-insights-service.ts:617-624: defaults to oldest last activity; severity uses two-tier CASE.
- Fix: Default sort by true reason count descending; include stable tiebreak.

## G2-7-001-024  [P1] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:145-161: search matches displayed workspace name/title and mentor on the current page.
- vNext now: V/modules/projects/admin-insights-service.ts:501-513: searches title, slug, UUID; not mentor.
- Fix: Add tenant-safe mentor-name search in SQL before pagination.

## G2-7-001-040  [P1] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/adminProjectUtils.js:208-246: stale after >=7 days of activity timestamp; missing timestamp means not stalled.
- vNext now: V/modules/projects/admin-insights-service.ts:521-531,559-578: greatest updatedAt of project and eight child entities, cutoff 7 days.
- Fix: Reconcile actual activity sources and status interpretation.

## G2-7-001-043  [P1] GAP  facet F12  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:129-132: excludes archived client-side but completed with blocker/review can still qualify.
- vNext now: V/modules/projects/admin-insights-service.ts:563-578: excludes ARCHIVED and COMPLETED.
- Fix: Align completed-project inclusion across counts and visible rows.

## G2-7-001-044  [P1] GAP  facet F12  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:94-108: bucket counts each pass the current search to the backend.
- vNext now: V/modules/projects/admin-insights-service.ts:581-595: whole-college bucket counts ignore search and status.
- Fix: Make count scope match search filters or label as unfiltered.

## G2-7-001-048  [P1] GAP  facet F14  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:368-392: CSV file `at-risk-projects.csv`; headers Workspace/Mentor/Status/Severity/Risk reasons.
- vNext now: V/components/projects/project-at-risk-page-export.tsx:12-21: filename with college/date; ID, title, mentor, severity, reasons, inactivity, blocker, UTC; no actual Status.
- Fix: Restore five headers, true Status values, and legacy filename.

## G2-7-001-063  [P1] GAP  facet F20  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:75-83: query-preserving shallow replace on quick-filter toggle.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:90-91: quick-chip href replaces full URL with riskBucket alone.
- Fix: Preserve q, status, riskSort, pageSize when toggling, resetting page.

## G2-7-001-066  [P1] GAP  facet F22  effort M
- Legacy: LBE/model/ProjectWorkspace.java:15-32,58-60: entity project_workspace, slug 80, title 160, status IN_PROGRESS default, blocker TEXT.
- vNext now: V/db/schema/projects.ts:172-203: project_instances UUID tenant, slug 96, title TEXT, status PLANNED default, blocker TEXT.
- Fix: Document intentional slug/status differences and preserve blocker parity.

## G2-7-001-067  [P1] GAP  facet F22  effort L
- Legacy: LBE/repository/ProjectWorkspaceRepository.java:118-149: AT_RISK* use p.updatedAt, ProjectDelivery review, blocker field.
- vNext now: V/modules/projects/admin-insights-service.ts:520-578: multi-entity activity timestamp, latest ProjectSubmission, task-blocker statuses.
- Fix: Reconcile query semantics and required indexes.

## G2-7-001-030  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:309-310: error title `Report could not be loaded`, API message as description.
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:64-66: `At-risk workspaces unavailable`, generic failure text.
- Fix: Restore title and safe API error message.

## G2-7-001-031  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:109-119: failed call fallback `Failed to load project workspaces.`
- vNext now: V/components/projects/project-admin-at-risk-page.tsx:55-67: catches every error, cannot show specific API failure.
- Fix: Distinguish access, network, query, and general report failures.

## G2-7-001-032  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/at-risk/index.js:67-83: unrecognized filter strings are reflected in query, then ignored if unknown.
- vNext now: V/modules/projects/admin-risk-query-model.ts:20-31: unknown params invalid; shows `Invalid project filters` at page.tsx:42-52.
- Fix: Normalize legacy alias values but reject malicious keys.

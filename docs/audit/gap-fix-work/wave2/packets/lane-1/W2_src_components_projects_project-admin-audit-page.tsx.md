# Work packet (wave 2): edit src/components/projects/project-admin-audit-page.tsx

36 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-7/u030-superadmin-project-audit.md, docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-2-020-015  [P2] GAP  facet F04  effort M
- Legacy: AdminProjectController.java:720-830 audit enriches actorName and entityName
- vNext now: src/components/projects/project-admin-audit-page.tsx:93-126 activity groups with actor and subjectLabel
- Fix: Keep audit actor and target names, raw actions, entity IDs, timestamps.

## G2-2-020-063  [P2] GAP  facet F19  effort M
- Legacy: AdminProjectController.java:720-737 audit defaults page=0,size25
- vNext now: src/components/projects/project-admin-audit-page.tsx:65-79 reads 40 grouped events
- Fix: Match audit 25-row page and visible total/next page.

## G2-2-020-068  [P2] GAP  facet F21  effort M
- Legacy: AdminProjectController.java:720-764 audits by actionKey,actorUserId,entityId,sinceMillis
- vNext now: src/components/projects/project-admin-audit-page.tsx:63-80 filters eventType,importance,subject,from,to
- Fix: Map actor and exact entity filters plus date interval.

## G2-7-030-004  [P2] GAP  facet F01  effort S
- Legacy: audit/index.js:498-505 header actions Refresh and View activity log
- vNext now: project-admin-audit-page.tsx:316-320 refresh and /admin/audit links underneath stats
- Fix: Restore head action placement, icon and labels

## G2-7-030-005  [P2] GAP  facet F02  effort M
- Legacy: audit/index.js:490-524 PageHead, error, range buttons, active entity filter
- vNext now: project-admin-audit-page.tsx:189-205 PageHeader, Banner, Tabs range, details Filters
- Fix: Recreate old section order and selected range appearance

## G2-7-030-006  [P2] GAP  facet F02  effort M
- Legacy: audit/index.js:525-571 three Statistic Cards in responsive three-column Row
- vNext now: project-admin-audit-page.tsx:303-315 three flat metric tiles with divide border
- Fix: Use bordered Statistic Card style and same breakpoints

## G2-7-030-007  [P2] GAP  facet F02  effort L
- Legacy: audit/index.js:573-654 Change log Card with header filters and Table
- vNext now: project-admin-audit-page.tsx:316-339 toolbar plus grouped ActivityCenter articles
- Fix: Use Change log Card and four-column expandable Table

## G2-7-030-008  [P2] GAP  facet F02  effort M
- Legacy: audit/index.js:617-624 eight-row Skeleton for Change log
- vNext now: project-admin-audit-page.tsx:65-91 server read with full error rather than skeleton
- Fix: Match eight-row loading placeholder within Card

## G2-7-030-009  [P2] GAP  facet F03  effort S
- Legacy: audit/index.js:512-516 Today/7 days/30 days/All time small AntD buttons
- vNext now: project-admin-audit-page.tsx:167-205 Tabs with same visible range labels
- Fix: Match small rounded buttons, selected solid treatment

## G2-7-030-010  [P2] GAP  facet F03  effort S
- Legacy: audit/index.js:533-568 three statistics and destructive red count/WarningOutlined
- vNext now: project-admin-audit-page.tsx:303-314 plain large counts without warning icon
- Fix: Restore warning icon/tone and capped count helper copy

## G2-7-030-011  [P2] GAP  facet F03  effort M
- Legacy: audit/index.js:577-584 Filter by action clearable select
- vNext now: project-admin-audit-page.tsx:213-225 Action native Select in details filter
- Fix: Put action selector into Change log header with allowClear

## G2-7-030-014  [P2] GAP  facet F03  effort S
- Legacy: audit/index.js:517-521 entity filter closable blue Tag Filtered to: ID
- vNext now: project-admin-audit-page.tsx:262-265 Entity ID input, no same closable Tag
- Fix: Show and clear active entity filter Tag

## G2-7-030-026  [P2] GAP  facet F06  effort M
- Legacy: audit/index.js:103-115 range defaults Today and options 7d/30d/All time
- vNext now: project-admin-audit-page.tsx:167-186 maps Today/7 days/30 days/All time based on IST dates
- Fix: Match original day window semantics (7d/30d subtract days startOf day)

## G2-7-030-028  [P2] GAP  facet F06  effort M
- Legacy: audit/index.js:156-198 entityId filter retained in URL and closable tag
- vNext now: project-admin-audit-page.tsx:262-265 subjectId field submitted via Apply
- Fix: Preserve entity deep link and one-click clear UX

## G2-7-030-029  [P2] GAP  facet F06  effort S
- Legacy: audit/index.js:247-283 Refresh reloads current exact filter/scope
- vNext now: project-admin-audit-page.tsx:152-154 preserves action/importance/subject/from/to on Refresh
- Fix: Preserve legacy entity and range aliases as well

## G2-7-030-040  [P2] GAP  facet F09  effort S
- Legacy: audit/index.js:518-521 closable filter Tag removes entity scope
- vNext now: project-admin-audit-page.tsx:262-265 form field and Reset whole filters
- Fix: Add single-filter dismiss preserving other filters

## G2-7-030-049  [P2] GAP  facet F12  effort M
- Legacy: audit/index.js:103-115 default Today, 7d,30d,All time, range start day
- vNext now: project-admin-audit-page.tsx:167-186 date filter uses IST today minus 6/29 days
- Fix: Match complete interval semantics and time boundary

## G2-7-030-050  [P2] GAP  facet F12  effort M
- Legacy: audit/index.js:247-283 server page=0-based range-dependent size
- vNext now: project-admin-audit-page.tsx:65-79 cursor 40 always
- Fix: Align cap/page behavior and disclosure

## G2-7-030-053  [P2] GAP  facet F13  effort M
- Legacy: audit/index.js:617-624 result loading skeleton8 rows
- vNext now: project-admin-audit-page.tsx:65-91 awaited server result, no local shape skeleton
- Fix: Restore skeleton rows and aria-busy

## G2-7-030-055  [P2] GAP  facet F13  effort S
- Legacy: audit/index.js:263-269 invalid non-All page clamps back to first
- vNext now: project-admin-audit-page.tsx:128-163 cursor invalid ignored and warning banner
- Fix: Handle stale links without surprising empty list

## G2-7-030-062  [P2] GAP  facet F16  effort M
- Legacy: audit/index.js:525-570 Row cards xs24 sm8 (1/3 columns)
- vNext now: project-admin-audit-page.tsx:303-315 grid 1/2/3 columns at mobile/md/992
- Fix: Match old breakpoint and card widths

## G2-7-030-064  [P2] GAP  facet F17  effort M
- Legacy: audit/index.js:372-388 entity filter role button tabindex0 Enter and Space
- vNext now: project-admin-audit-page.tsx:262-265 input instead of row-level filter button
- Fix: Restore accessible quick filter from displayed entity

## G2-7-030-066  [P2] GAP  facet F18  effort S
- Legacy: audit/index.js:495-496 Project audit / Who changed what, and when — check daily for anything unexpected.
- vNext now: project-admin-audit-page.tsx:193-194 dynamic global description Platform-wide...
- Fix: Use exact subtitle on scoped view, extra global note separate

## G2-7-030-067  [P2] MISSING  facet F18  effort S
- Legacy: audit/index.js:573-574 Change log
- vNext now: project-admin-audit-page.tsx:328 ActivityCenter without Change log label
- Fix: Restore Change log heading

## G2-7-030-068  [P2] GAP  facet F18  effort S
- Legacy: audit/index.js:579 Filter by action
- vNext now: project-admin-audit-page.tsx:215 Action
- Fix: Match placeholder and label

## G2-15-017-003  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:87-98 intro headline and explanation
- vNext now: src/components/projects/project-admin-audit-page.tsx:193-203 generic Project audit heading
- Fix: Add old Resource activity headline, helper and section order

## G2-15-017-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:99-111 Changes/Added/Edited/Removed counters
- vNext now: src/components/projects/project-admin-audit-page.tsx:303-319 different generic audit metrics
- Fix: Restore four mutation metrics in original order

## G2-15-017-006  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/projects/workspaces/[workspaceId]/audit.js:77-88 View audit trail with icon
- vNext now: src/components/projects/project-admin-audit-page.tsx:319-329 View activity log destination
- Fix: Link to complete project audit with entityId and range=all

## G2-15-017-013  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:63-85 columns Resource,Action,Actor,When
- vNext now: src/components/projects/project-admin-audit-page.tsx:321-335 generic activity table
- Fix: Add four exact columns in original order

## G2-15-017-014  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:36-53 local case-folded search over key/name/id/type/action
- vNext now: src/components/projects/project-admin-audit-page.tsx:211-294 generic URL filters
- Fix: Search all five legacy haystack fields

## G2-15-017-018  [P2] MISSING  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:113-120 allowClear search default empty
- vNext now: src/components/projects/project-admin-audit-page.tsx:193-211 no resource search field
- Fix: Default query empty; clear restores all items

## G2-15-017-033  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:135-143 five-row Skeleton on load, alert and Retry on error
- vNext now: src/components/projects/project-admin-audit-page.tsx:83-89 generic audit ErrorState and Retry audit
- Fix: Use resource-history-specific skeleton, inline alert, Retry

## G2-15-017-034  [P2] MISSING  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:144-147 two exact empty-state messages
- vNext now: src/components/projects/project-admin-audit-page.tsx:329-342 generic audit summary/empty state
- Fix: Distinguish no changes from filtered no matches

## G2-15-017-037  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:149-155 compact horizontally scrolling table
- vNext now: src/components/projects/project-admin-audit-page.tsx:303-319 generic responsive grid
- Fix: Use x:max-content table scrolling on narrow screens; verify visually

## G2-15-017-038  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:113-124 aria-label Search resource audit and Filter audit actions
- vNext now: src/components/projects/project-admin-audit-page.tsx:204-211 Audit time range tabs label
- Fix: Restore exact search/select accessible labels and focus order

## G2-15-017-039  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:91-95 Resource activity and See who changed project resources and when
- vNext now: src/components/projects/project-admin-audit-page.tsx:193-194 Project audit title
- Fix: Use exact old heading and intro sentence on this route

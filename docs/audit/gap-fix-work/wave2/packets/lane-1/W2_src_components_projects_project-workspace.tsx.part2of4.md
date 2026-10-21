# Work packet (wave 2): edit src/components/projects/project-workspace.tsx (part 2 of 4)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-workspace-delivery.md, docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md, docs/audit/gap2/lane-7/u010-college-admin-workspace-meetings.md, docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md

## G2-3-029-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:88-117`
- vNext now: `src/components/projects/project-workspace.tsx:1299-1318`
- Fix: Legacy Additional evidence standalone Card with count badge and rows; vNext evidence nested within each version article.

## G2-3-029-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:118-137`
- vNext now: `src/components/projects/project-workspace.tsx:1345-1356`
- Fix: Legacy Review standalone Card with separate reviewed-by/reviewed-at/feedback; vNext review left border block embedded per submission.

## G2-3-029-009  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:20-33`
- vNext now: `src/components/projects/project-workspace.tsx:1232-1235`
- Fix: Legacy empty state Card Delivery plus two-sentence task link guidance; vNext generic Not submitted EmptyState with shortened description.

## G2-3-029-010  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:52-59`
- vNext now: `src/components/projects/project-workspace.tsx:1260-1275`
- Fix: Legacy eyebrow Final delivery, title Submission package and review state, status Tag on same hero row; vNext heading Final submission then Version and StatusBadge.

## G2-3-029-013  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:118-136`
- vNext now: `src/components/projects/project-workspace.tsx:1345-1356`
- Fix: Legacy Reviewed by, Reviewed at, Mentor feedback labels; vNext Review · decision and feedback only, reviewer identity/time not adjacent.

## G2-3-029-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:17-45`
- vNext now: `src/components/projects/project-workspace.tsx:1237-1293`
- Fix: Legacy uses one resolvedDelivery object (fallback delivery); vNext maps all versioned submissions, reviews and evaluations. Create latest-only summary or explicitly show history separately.

## G2-3-029-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:36-39`
- vNext now: `src/components/projects/project-workspace.tsx:1302-1318`
- Fix: Legacy attachmentUrl or submissionFileUrl and sourceUrl with optional fileName; vNext typed attachment FILE/LINK, fileId grants and source/demo URLs; map old attachment payload.

## G2-3-029-022  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:95-111`
- vNext now: `src/components/projects/project-workspace.tsx:1302-1318`
- Fix: Legacy safely handles attachment objects with no URL as Unavailable link; vNext uses FILE kind/fileId branch then File · name (not available). Match copy.

## G2-3-029-028  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/SuperAdminWorkspaceShell.jsx:23-27`
- vNext now: `src/components/projects/project-workspace.tsx:324-337`
- Fix: Legacy workspace tabs preserve active Delivery tab and breadcrumb before content; vNext uses generic Tabs/back layout and risk query suffix.

## G2-3-029-037  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:41-45`
- vNext now: `src/components/projects/project-workspace.tsx:1278-1293`
- Fix: Legacy revisionCount from delivery DTO; vNext derives max(0,submission.version - 1), can differ for resubmits or reassignment.

## G2-3-029-039  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:20-33`
- vNext now: `src/components/projects/project-workspace.tsx:1232-1235`
- Fix: Legacy no final submission displays task-level fallback; vNext does not direct user to Tasks tab.

## G2-3-029-040  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:70-83`
- vNext now: `src/components/projects/project-workspace.tsx:1299-1318`
- Fix: Legacy direct downloadable file URL and explicit source URL; vNext fileId signed grant and source/demo. Provide safe filename/open linkage.

## G2-3-029-046  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:73-81`
- vNext now: `src/components/projects/project-workspace.tsx:1320-1343`
- Fix: Legacy anchors use rel noreferrer noopener, vNext rel noreferrer for source/demo (modern implicit noopener); standardize accessible names/new-tab notice.

## G2-3-029-047  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:52-57`
- vNext now: `src/components/projects/project-workspace.tsx:1220-1275`
- Fix: Exact title Submission package and review state missing, Final delivery replaced by Final submission.

## G2-3-029-051  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:17-20`
- vNext now: `src/components/projects/project-workspace.tsx:1237-1258`
- Fix: Legacy shows latest only; vNext renders all versions unpaginated. Long history may balloon DOM; add history disclosure/pagination.

## G2-3-029-057  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:36-39`
- vNext now: `src/components/projects/project-workspace.tsx:1299-1318`
- Fix: Legacy evidence attachment {url,label,fileName,addedByName} vs vNext {kind,fileId,url,name}; map uploader attribution.

## G2-3-029-059  [P2] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:119-135`
- vNext now: `src/components/projects/project-workspace.tsx:1345-1356`
- Fix: Legacy Reviewed by/at and fallback copy not rendered in vNext review block; restore read-only summary while retaining history.

## G2-4-029-002  [P2] GAP  facet F01  effort S
- Legacy: Workspace shell tabs, breadcrumb, Back to projects and current workspace title (`docs/legacy-source/frontend/src/components/admin/SuperAdminWorkspaceShell.jsx:14-27`)
- vNext now: Shared project tabs with ADMIN mode and back link (`src/components/projects/project-workspace.tsx:316-335`)
- Fix: Match workspace breadcrumb, back label, active Audit tab and title.

## G2-4-029-003  [P2] GAP  facet F01  effort S
- Legacy: `View audit trail` to `/superadmin/projects/audit?entityId=ID&range=all` (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:74-83`)
- vNext now: Link `/admin/projects/audit?projectId=ID` (`src/components/projects/project-workspace.tsx:1669-1670`)
- Fix: Preserve all-range filter and entity key translation.

## G2-4-029-004  [P2] GAP  facet F02  effort S
- Legacy: Missing college keeps SuperAdminWorkspaceShell + warning/skeleton (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:47-64`)
- vNext now: Shared project shell generated after access resolved (`src/components/projects/project-workspace.tsx:316-335`)
- Fix: Provide same scoped-college recoverability and tabs in absent-college state.

## G2-4-029-005  [P2] GAP  facet F02  effort S
- Legacy: Shell title/subtitle/action, workspace warning, then ResourceAudit component (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:68-103`)
- vNext now: Activity heading/description and feed, with full audit link below heading (`src/components/projects/project-workspace.tsx:1658-1674`)
- Fix: Create dedicated Resource activity card beneath audit header.

## G2-4-029-006  [P2] MISSING  facet F02  effort S
- Legacy: Card intro eyebrow/headline/help, four metric tiles (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:87-111`)
- vNext now: Activity section no resource metrics (`src/components/projects/project-workspace.tsx:1658-1674`)
- Fix: Restore resource audit intro and counters.

## G2-4-029-010  [P2] GAP  facet F03  effort S
- Legacy: Eyebrow Resource activity and headline See who changed project resources and when (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:91-97`)
- vNext now: Generic Activity title and task/sprint description (`src/components/projects/project-workspace.tsx:1661-1666`)
- Fix: Use exact legacy resource audit copy.

## G2-4-029-033  [P2] GAP  facet F10  effort S
- Legacy: BE controller returns 200 `Resource audit retrieved` or error (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:839-861`)
- vNext now: Feed consumes activity data, no resource-audit success envelope (`src/components/projects/project-workspace.tsx:1658-1674`)
- Fix: Provide compatibility response where legacy consumer requires.

## G2-4-029-043  [P2] GAP  facet F13  effort S
- Legacy: Workspace warning does not hide independent ResourceAudit (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:87-95`)
- vNext now: Shared project view loads several services together (`src/components/projects/project-workspace.tsx:316-335`)
- Fix: Decouple resource history read from summary read failure.

## G2-4-029-051  [P2] MISSING  facet F17  effort S
- Legacy: Retry workspace Button accessible label and loading state (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:89-95`)
- vNext now: No separate retry workspace action in audit section (`src/components/projects/project-workspace.tsx:1658-1674`)
- Fix: Keep retry action focusable and pending feedback.

## G2-4-029-052  [P2] GAP  facet F18  effort S
- Legacy: Title `Resource activity`, headline `See who changed project resources and when` (`docs/legacy-source/frontend/src/components/admin/projects/WorkspaceResourceAudit.jsx:91-97`)
- vNext now: `Activity`, task/sprint subtitle (`src/components/projects/project-workspace.tsx:1661-1666`)
- Fix: Restore exact title and headline.

## G2-4-029-055  [P2] GAP  facet F18  effort S
- Legacy: Page subtitle `Trace resource changes here, or open the full project audit trail for broader events.` (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:73-82`)
- vNext now: Generic project activity subtitle (`src/components/projects/project-workspace.tsx:1663-1666`)
- Fix: Use old audit-specific subtitle.

## G2-14-028-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy title college-scoped workspace name and Health/setup/operating subtitle. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:405-450`
- vNext now: vNext header uses title and summary, not same subtitle. `src/components/projects/project-workspace.tsx:185-211`
- Fix: Restore original summary subtitle and page head.

## G2-14-028-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy snapshot and risk banners above always-open Workspace settings Card. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:492-523`
- vNext now: vNext summary editor collapsed behind Edit workspace summary then top metric strip. `src/components/projects/project-workspace.tsx:335-365`, `src/components/projects/college-project-summary-editor-full.tsx:67-70`
- Fix: Use old always-visible editor and snapshot placement.

## G2-14-028-008  [P2] GAP  facet F03  effort M
- Legacy: Legacy status/template/phase tags and linked template tag. `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSummarySnapshot.jsx:77-88`
- vNext now: vNext status badge, no analogous template and phase quick tags. `src/components/projects/project-workspace.tsx:195-199,364-412`
- Fix: Restore tags and template deep link.

## G2-14-028-009  [P2] GAP  facet F03  effort M
- Legacy: Legacy risk WarningOutlined alert and filtered-view info alert. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:497-520`
- vNext now: vNext plain origin status strip; no full risk badge or stale reason. `src/components/projects/project-workspace.tsx:335-338`
- Fix: Render risk severity, reasons and stale-comparison banner.

## G2-14-028-046  [P2] GAP  facet F13  effort M
- Legacy: Legacy linked at-risk reason recomputed, detects stale category. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:384-401,508-520`
- vNext now: vNext shows category label only; no stale explanation. `src/components/projects/project-workspace.tsx:335-338`
- Fix: Recompute risk reason and distinguish updated data.

## G2-14-028-051  [P2] GAP  facet F16  effort M
- Legacy: Legacy summary snapshot one health card with primary and side metrics. `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceSummarySnapshot.jsx:73-112`
- vNext now: vNext 2xl4 metrics, no same single card. `src/components/projects/project-workspace.tsx:364-412`
- Fix: Match card proportions.

## G2-14-028-054  [P2] GAP  facet F18  effort M
- Legacy: Legacy subtitle Health, setup and operating details for this workspace. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:410-411`
- vNext now: vNext header description is workspace summary. `src/components/projects/project-workspace.tsx:185-191`
- Fix: Restore exact subtitle.

## G2-7-010-012  [P2] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/projectSectionFieldConfigs.js:178-186: Status options SCHEDULED,RESCHEDULED,COMPLETED,CANCELLED,DRAFT,REQUESTED.
- vNext now: V/db/schema/projects.ts:1188-1191 and components/projects/project-workspace.tsx:1553-1560: six stored statuses; state changes through actions, not row Select.
- Fix: Provide equivalent status edit choices gated by backend transition validity.

## G2-7-010-047  [P2] GAP  facet F18  effort S
- Legacy: LFE/components/admin/projects/WorkspaceMeetingsEditor.jsx:70-79: `Add meeting`, `Save meeting plan`, `Calendar sync and follow-up state remain system-managed.`
- vNext now: V/components/projects/project-meeting-controls.tsx:220-224, project-workspace.tsx:1476-1499: schedule controls and no footer hint.
- Fix: Restore action/footer copy.

## G2-7-012-002  [P2] GAP  facet F01  effort S
- Legacy: readiness.js:72-77 title normalised and subtitle Understand submission readiness, proof coverage and any manual override at a glance.
- vNext now: project-workspace.tsx:178-193 generic title and summary subtitle
- Fix: Restore exact subtitle and normalized title

## G2-7-012-004  [P2] GAP  facet F01  effort M
- Legacy: AdminWorkspaceShell.jsx:10-27 full breadcrumb contextual Back and tab strip
- vNext now: project-workspace.tsx:320-335 section route omits breadcrumb
- Fix: Show breadcrumbs and contextual Back

## G2-7-012-009  [P2] MISSING  facet F03  effort S
- Legacy: WorkspaceReadinessOverview.jsx:58-64 Overall project progress label percent and Progress bar
- vNext now: project-workspace.tsx:364-416 no combined progress bar
- Fix: Add percentage and accessible bar

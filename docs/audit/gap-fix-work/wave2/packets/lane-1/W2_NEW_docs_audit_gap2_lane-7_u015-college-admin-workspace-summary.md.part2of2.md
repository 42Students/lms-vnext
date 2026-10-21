# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md (part 2 of 2)

4 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md

## G2-7-015-076  [P2] MISSING  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:133-187 mergeSelectedIntoOptions retains selected template label during search
- vNext now: V/components/projects/project-workspace.tsx:178-210 no template selector
- Fix: Preserve selected option during search results

## G2-7-015-078  [P2] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:438-460 stale at-risk reason compared by category, not literal day count
- vNext now: V/components/projects/project-workspace.tsx:334-340 uses only STALLED/BLOCKER/REVIEW flags; no mismatch logic
- Fix: Retain reason mismatch banner and recalculation

## G2-7-015-082  [P2] GAP  facet F22  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSummarySnapshot.jsx:43-71 template title/version and readiness derived counters in DTO
- vNext now: V/modules/projects/workspace-view-service.ts:100-128 templateOverview and readiness nested from separate tables
- Fix: Expose template identity/version and derived quick facts

## G2-7-015-079  [P3] GAP  facet F21  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:171-216 async template and class requests; no background worker on page
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:31-39 class fetch; service writes activity and notifications
- Fix: Audit link to template catalog and notification side effects

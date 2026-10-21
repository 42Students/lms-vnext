# Work packet: edit src/components/projects/project-admin-readiness-page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u032-superadmin-readiness.md

## G2-7-032-002  [P1] GAP  facet F01  effort L
- Legacy: readiness/index.js:248-274 URL ?projectId=slug preselects workspace
- vNext now: project-admin-readiness-page.tsx:108-111 accepts UUID projectId or workspaceId only
- Fix: Translate legacy slugs to UUID with scoped lookup for direct bookmarks

## G2-7-032-007  [P1] GAP  facet F02  effort L
- Legacy: readiness/index.js:515-721 selected workspace Current readiness, Releases, Manual override Cards
- vNext now: project-admin-readiness-page.tsx:123-146 select shows releases then Manage link to separate page
- Fix: Provide same-page readiness metrics/releases/override or explicit parity navigation

## G2-7-032-051  [P1] GAP  facet F12  effort M
- Legacy: readiness/index.js:155-169 archived removed from picker but included when currently selected
- vNext now: college-readiness-releases-service.ts:24-26 excludes ARCHIVED globally; project-admin-readiness-page.tsx:108-110 rejects selected archived
- Fix: Keep archived override manageable from active overrides list

## G2-7-032-055  [P1] GAP  facet F13  effort M
- Legacy: readiness/index.js:595-599 releases load error vs no releases
- vNext now: project-admin-readiness-page.tsx:111 await release read not wrapped in dedicated error
- Fix: Catch release-only failure without crashing selected detail page

## G2-7-032-036  [P2] GAP  facet F07  effort S
- Legacy: readiness/index.js:488-489 Couldn't load workspaces
- vNext now: project-admin-readiness-page.tsx:98-105 Submission readiness unavailable full page
- Fix: Distinguish workspace selection failed vs entire readiness failed

## G2-7-032-039  [P2] GAP  facet F08  effort S
- Legacy: readiness/index.js:723 Select a workspace info Alert with helpful instruction
- vNext now: project-admin-readiness-page.tsx:123-125 selection disclosure without same info text
- Fix: Restore instructional empty-selection alert

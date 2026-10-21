# Work packet (wave 2): edit src/components/projects/project-admin-readiness-page.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md, docs/audit/gap2/lane-7/u032-superadmin-readiness.md

## G2-7-004-039  [P2] GAP  facet F10  effort M
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:186,218: GET readiness and releases for selected project.
- vNext now: V/components/projects/project-workspace-readiness.tsx:29-32: getProjectReadiness on separate route; components/projects/project-admin-readiness-page.tsx:111: separately reads releases.
- Fix: Include readiness detail in selected group's inline context.

## G2-7-032-003  [P2] GAP  facet F01  effort M
- Legacy: readiness/index.js:371-381 Manage override selects workspace and scrolls form into view
- vNext now: project-admin-readiness-page.tsx:162-165 Manage opens separate /admin/projects/{id}/readiness page
- Fix: Restore same-page scroll and selection or document split flow

## G2-7-032-004  [P2] GAP  facet F01  effort S
- Legacy: readiness/index.js:407-417 header Submission readiness with exact subtitle
- vNext now: project-admin-readiness-page.tsx:119-120 title matches, description longer than legacy
- Fix: Use same subtitle directly below heading

## G2-7-032-005  [P2] GAP  facet F02  effort S
- Legacy: readiness/index.js:419-485 Active overrides Card is first, with badge/export
- vNext now: project-admin-readiness-page.tsx:123-146 Select workspace Disclosure before Active overrides
- Fix: Restore Active overrides first section

## G2-7-032-006  [P2] GAP  facet F02  effort S
- Legacy: readiness/index.js:487-511 Select workspace Card after overrides
- vNext now: project-admin-readiness-page.tsx:123-146 Select workspace Disclosure first
- Fix: Match Card treatment/order and spacing

## G2-7-032-008  [P2] GAP  facet F02  effort S
- Legacy: readiness/index.js:419 narrow-content single column panel
- vNext now: project-admin-readiness-page.tsx:115-279 full-width rows and disclosures
- Fix: Match old constrained card column width

## G2-7-032-009  [P2] GAP  facet F03  effort S
- Legacy: readiness/index.js:425 Badge active override count gold/default
- vNext now: project-admin-readiness-page.tsx:147 title Active overrides (N), no badge
- Fix: Render dedicated count badge color by nonzero

## G2-7-032-010  [P2] GAP  facet F03  effort S
- Legacy: readiness/index.js:427-455 DownloadOutlined Export CSV at overrides Card header
- vNext now: project-admin-readiness-page.tsx:169-172 Export overrides CSV standalone text Link
- Fix: Place icon/Export CSV button in Card header

## G2-7-032-018  [P2] GAP  facet F04  effort M
- Legacy: readiness/index.js:595-635 release table name/status/sprints/points target date
- vNext now: project-admin-readiness-page.tsx:131-145 similar columns but points numeric aggregate and no explanatory Card subtitle
- Fix: Match committed/completed points and exact release metadata

## G2-7-032-019  [P2] GAP  facet F04  effort S
- Legacy: readiness/index.js:322-332 override Active Force unlocked green, Force blocked volcano with icons
- vNext now: project-admin-readiness-page.tsx:153-159 status text Ready/Not ready
- Fix: Restore force label/icons and colors

## G2-7-032-021  [P2] GAP  facet F05  effort M
- Legacy: readiness/index.js:470-477 active overrides Table 25/page when total>25
- vNext now: project-admin-readiness-page.tsx:147-168 DataTable without paging all returned records
- Fix: Use server-side 25-row pagination for large override lists

## G2-7-032-025  [P2] GAP  facet F05  effort S
- Legacy: readiness/index.js:338-380 Manage selects and scrolls rather than navigating
- vNext now: project-admin-readiness-page.tsx:162-165 href to detail
- Fix: Preserve in-page Manage behavior or make clear destination

## G2-7-032-043  [P2] GAP  facet F10  effort M
- Legacy: readiness/index.js:99-130 two paged server project lists including READINESS_OVERRIDE view
- vNext now: project-admin-readiness-page.tsx:92-96 listProjectAdminSnapshots, activeOverrides, choices
- Fix: Ensure independent failures and active-override total parity

## G2-7-032-044  [P2] GAP  facet F10  effort M
- Legacy: readiness/index.js:178-246 GET readiness and releases independently
- vNext now: project-admin-readiness-page.tsx:108-111 release read, workspace-readiness.tsx:30-31 readiness on detail
- Fix: Keep distinct failure states for readiness vs releases

## G2-7-032-053  [P2] GAP  facet F13  effort M
- Legacy: readiness/index.js:457,516,593 skeletons lengths2/4/2 for project/release detail
- vNext now: project-admin-readiness-page.tsx:92-115 SSR data fetch without matching skeleton
- Fix: Restore shape-matched loading states

## G2-7-032-054  [P2] GAP  facet F13  effort S
- Legacy: readiness/index.js:479-483 green empty icon/check No workspace currently has a manual override
- vNext now: project-admin-readiness-page.tsx:147-150 same copy as plain paragraph
- Fix: Restore icon and Card empty treatment

## G2-7-032-058  [P2] GAP  facet F14  effort S
- Legacy: readiness/index.js:428-429 disabled Export when no visible overrides
- vNext now: project-admin-readiness-page.tsx:169-172 export link always available
- Fix: Disable for zero matches and avoid misleading blank file

## G2-7-032-062  [P2] GAP  facet F16  effort M
- Legacy: readiness/index.js:419 narrow-content plus 420px Search and Select controls
- vNext now: project-admin-readiness-page.tsx:115-279 full-width disclosure and radio list
- Fix: Match responsive constrained card width at 375/768/1280

## G2-7-032-063  [P2] GAP  facet F16  effort S
- Legacy: readiness/index.js:470-477 active override Table scroll x=max-content
- vNext now: project-admin-readiness-page.tsx:150-165 DataTable with mobile priorities
- Fix: Match horizontal scroll and table headers at mobile

## G2-7-032-067  [P2] GAP  facet F18  effort S
- Legacy: readiness/index.js:412-413 Submission readiness / See whether each team is ready to submit, and override the gate when you need to.
- vNext now: project-admin-readiness-page.tsx:119-120 includes added sentence
- Fix: Use exact page description

## G2-7-032-068  [P2] GAP  facet F18  effort S
- Legacy: readiness/index.js:422 Active overrides / :487 Select workspace / :518 Current readiness / :592 Releases / :638 Manual override
- vNext now: project-admin-readiness-page.tsx:123,147 and detail :60,84 different ordering and split
- Fix: Restore exact card titles and order

## G2-7-032-076  [P2] GAP  facet F21  effort L
- Legacy: readiness/index.js:31-35 AdminService getProjectReadiness/getProjectReleases/overrideProjectReadiness
- vNext now: project-admin-readiness-page.tsx:4-6 service reads plus workspace-readiness.tsx:5 override route
- Fix: Document API contract mapping and side effects per action

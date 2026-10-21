# Work packet (wave 2): edit src/app/(authenticated)/mentor/projects/[projectId]/page.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u027-mentor-project-detail.md

## G2-7-027-003  [P2] GAP  facet F01  effort S
- Legacy: PDC:832-836 tasks alias calls router.replace to board
- vNext now: mentor/projects/[projectId]/page.tsx:29 internally maps tasks board without canonical redirect
- Fix: Replace URL to board rather than leaving stale tasks query

## G2-7-027-007  [P2] GAP  facet F02  effort M
- Legacy: ProjectsShell.jsx:42-54 scroll-container plus PageShell title/subtitle/actions/tabs then body
- vNext now: mentor/projects/[projectId]/page.tsx:63-66 Breadcrumbs/header/tabs and independent sections
- Fix: Clone single legacy canvas and section order

## G2-7-027-008  [P2] GAP  facet F02  effort S
- Legacy: PDC:9454-9496 sr-only tab heading, visible subtitle, status banner then content
- vNext now: mentor/projects/[projectId]/page.tsx:65-95 tabs immediately followed by board or workspace; no tab subtitle
- Fix: Restore section subtitle under the active pill

## G2-7-027-013  [P2] MISSING  facet F03  effort S
- Legacy: PDC:1168-1176 active tab-specific subtitle beneath tabs
- vNext now: mentor/projects/[projectId]/page.tsx:63-95 no subtitle
- Fix: Render subtitle for all seven tabs

## G2-7-027-047  [P2] GAP  facet F09  effort M
- Legacy: PDC:9735-9740 submission review modal width980 on delivery deeplink
- vNext now: mentor/projects/[projectId]/page.tsx:40-43 delivery renders inline section
- Fix: Honor review dialog deeplink and focus behavior

## G2-7-027-062  [P2] GAP  facet F13  effort S
- Legacy: PDC:9391-9392 invalid tab description No project content available for this section.
- vNext now: mentor/projects/[projectId]/page.tsx:35-46 unrecognized falls back overview
- Fix: Decide unknown-tab recovery and exact empty text

## G2-7-027-072  [P2] GAP  facet F17  effort S
- Legacy: PDC:9457-9472 sr-only active section heading plus visible subtitle
- vNext now: mentor/projects/[projectId]/page.tsx:63-95 no section sr-only heading
- Fix: Restore heading structure and subtitle

## G2-7-027-075  [P2] MISSING  facet F18  effort S
- Legacy: PDC:1168-1176 Overview subtitle Current status, scope, and project summary.
- vNext now: mentor/projects/[projectId]/page.tsx:63-95 absent
- Fix: Add exact Overview subtitle

## G2-7-027-076  [P2] MISSING  facet F18  effort S
- Legacy: PDC:1168-1176 People, roles, and scheduled meetings.
- vNext now: mentor/projects/[projectId]/page.tsx:63-95 absent
- Fix: Add exact Team subtitle

## G2-7-027-077  [P2] MISSING  facet F18  effort S
- Legacy: PDC:1168-1176 Sprints, goals, and what ships when.
- vNext now: mentor/projects/[projectId]/page.tsx:63-95 absent
- Fix: Add exact Sprints subtitle

## G2-7-027-078  [P2] MISSING  facet F18  effort S
- Legacy: PDC:1168-1176 Active work, task movement, and ownership.
- vNext now: mentor/projects/[projectId]/page.tsx:67-76 absent
- Fix: Add exact Board subtitle

## G2-7-027-079  [P2] MISSING  facet F18  effort S
- Legacy: PDC:1168-1176 Assign work and rebalance the team's load.
- vNext now: mentor/projects/[projectId]/page.tsx:77-80 absent
- Fix: Add exact Task Allocation subtitle

## G2-7-027-080  [P2] MISSING  facet F18  effort S
- Legacy: PDC:1168-1176 Files, links, and shared reference material.
- vNext now: mentor/projects/[projectId]/page.tsx:81-94 absent
- Fix: Add exact Resources subtitle

## G2-7-027-081  [P2] MISSING  facet F18  effort S
- Legacy: PDC:1168-1176 Recent updates and history.
- vNext now: mentor/projects/[projectId]/page.tsx:37-40 maps activity to audit, no subtitle
- Fix: Add exact Activity subtitle

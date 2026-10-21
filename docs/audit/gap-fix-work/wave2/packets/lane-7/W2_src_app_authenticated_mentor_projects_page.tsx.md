# Work packet (wave 2): edit src/app/(authenticated)/mentor/projects/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u028-mentor-projects-list.md

## G2-7-028-005  [P2] GAP  facet F01  effort M
- Legacy: mentor/projects/index.js:15-27 feature loading Checking Projects access and failed Retry access check
- vNext now: mentor/projects/page.tsx:49-56 MentorProjectsUnavailable, no in-page verification Result
- Fix: Match gating states, labels and retry button

## G2-7-028-006  [P2] GAP  facet F02  effort M
- Legacy: ProjectsShell.jsx:42-54 PageShell with title/subtitle and child filters, cards, paging
- vNext now: mentor/projects/page.tsx:222-315 Header, filters, List, paging, then More project links
- Fix: Match original single continuous canvas and placement

## G2-7-028-020  [P2] GAP  facet F04  effort M
- Legacy: ProjectsContent.jsx:330-337 nextDue -> No due date / Overdue / Due soon / Due
- vNext now: mentor/projects/page.tsx:277-278 dueLabel/endDate passed, project-list.tsx:118-124 not dueState
- Fix: Use projectDueState and full visible legacy due condition

## G2-7-028-021  [P2] GAP  facet F04  effort S
- Legacy: ProjectsContent.jsx:375 phase fallback In progress
- vNext now: mentor/projects/page.tsx:275-278 phase; project-list.tsx:118-124 only rendered when present
- Fix: Render In progress fallback in phase line

## G2-7-028-051  [P2] GAP  facet F10  effort L
- Legacy: projectService.js:6-14 GET /api/v1/projects/me/page page,size,search,status,attention
- vNext now: mentor-paged-project-list-service.ts:16-80 SQL query/limit on standard filters; mentor/projects/page.tsx:74-81 full fallback for advanced
- Fix: Document endpoint query parity and bounded loading for advanced views

## G2-7-028-062  [P2] GAP  facet F12  effort S
- Legacy: ProjectsContent.jsx:329-338 blocked project deep link ?tab=board&lane=Blocked
- vNext now: mentor/projects/page.tsx:279-287 ?tab=board&lane=BLOCKED
- Fix: Align case-sensitive lane query value or accept both aliases

## G2-7-028-064  [P2] GAP  facet F13  effort M
- Legacy: ProjectsContent.jsx:305-311 three skeleton cards
- vNext now: mentor/projects/page.tsx:222-315 no matching list skeleton
- Fix: Add route loading skeleton cards with aria-hidden

## G2-7-028-065  [P2] GAP  facet F13  effort M
- Legacy: ProjectsContent.jsx:245-255 error/warning retained scope with Retry
- vNext now: mentor/projects/page.tsx:63-68 only invalid-filter full error and generic thrown-error boundary
- Fix: Match current-filter error/refresh UX

## G2-7-028-068  [P2] GAP  facet F13  effort S
- Legacy: mentor/projects/index.js:15-17 verifying Projects access loading Result
- vNext now: mentor/projects/page.tsx:49-56 server module check, no visible Result
- Fix: Show corresponding pending feature verification state

## G2-7-028-076  [P2] GAP  facet F17  effort S
- Legacy: ProjectsContent.jsx:305-311 ProjectCardSkeleton aria-hidden
- vNext now: mentor/projects/page.tsx:222-315 no shape-skeleton
- Fix: Mark future skeleton aria-hidden and list aria-busy

## G2-7-028-080  [P2] MISSING  facet F18  effort S
- Legacy: ProjectsContent.jsx:248-253 Projects could not be loaded / Couldn't refresh projects
- vNext now: mentor/projects/page.tsx:63-68 no in-context error headings
- Fix: Restore exact two-level error copy

## G2-7-028-085  [P2] GAP  facet F19  effort M
- Legacy: ProjectsContent.jsx:220-224 retains last settled scope on fetch error
- vNext now: mentor/projects/page.tsx:72-81 server read no last-good state
- Fix: Keep last-good scoped view during transient failure

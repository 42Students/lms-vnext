# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md

7 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md

## G2-7-020-003  [P2] GAP  facet F01  effort S
- Legacy: new.js:398-408 Create project workspace subtitle and guarded Back
- vNext now: create/page.tsx:22-24 Create workspace and different subtitle
- Fix: Use exact legacy page title/subtitle and dirty-aware Back

## G2-7-020-006  [P2] GAP  facet F02  effort M
- Legacy: new.js:393-454 one Card with Radio modes, conditional banners and Form
- vNext now: create/page.tsx:20-29 single form; workspaces/new/page.tsx:27-35 separate planner
- Fix: Keep mode selector and corresponding form in one canvas card

## G2-7-020-009  [P2] GAP  facet F02  effort S
- Legacy: new.js:396-412 page header then titled bordered Card
- vNext now: create/page.tsx:20-29 PageHeader then standalone section
- Fix: Match single bordered content surface and header placement

## G2-7-020-060  [P2] GAP  facet F11  effort S
- Legacy: new.js:380-390 missing college warning retains AdminGroupShell
- vNext now: create/page.tsx:13-18 No college selected ErrorState
- Fix: Match missing college copy and keep tabs available

## G2-7-020-069  [P2] GAP  facet F13  effort M
- Legacy: new.js:164-179 loading setup options and message.error on failure
- vNext now: create/page.tsx:19-29 assigned templates call not caught; workspaces/new/page.tsx:17-25 retry
- Fix: Add recoverable failures for each option list

## G2-7-020-072  [P2] GAP  facet F13  effort S
- Legacy: new.js:380-390 no college visible as warning within grouped shell
- vNext now: create/page.tsx:13-18 separate ErrorState
- Fix: Keep available project nav during missing-college state

## G2-7-020-086  [P2] GAP  facet F18  effort S
- Legacy: new.js:398-399 Create project workspace / Every workspace starts from a template — pick one below
- vNext now: create/page.tsx:22-23 Create workspace / Choose the published template...
- Fix: Restore exact heading and subtitle

# Work packet (wave 2): edit src/components/projects/class-team-workspace-creator.tsx (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md, docs/audit/gap2/lane-8/super-admin-project-workspace-new.md

## G2-2-020-032  [P2] GAP  facet F09  effort M
- Legacy: Legacy workspaces/new.js:252-267 Modal.confirm shows cohort count
- vNext now: src/components/projects/class-team-workspace-creator.tsx:127-130 native window.confirm
- Fix: Use accessible dialog with actual student/team names and total.

## G2-2-020-048  [P2] GAP  facet F13  effort M
- Legacy: Legacy workspaces/new.js:277-295 zero-created/partial cohort errors with report
- vNext now: src/components/projects/class-team-workspace-creator.tsx:140-149 created count or error
- Fix: Show per-student failures, skips, retry/export details.

## G2-2-020-056  [P2] GAP  facet F16  effort M
- Legacy: Legacy workspaces/new.js:350-395 form controls and roster preview grouped
- vNext now: src/components/projects/class-team-workspace-creator.tsx:33-47 stateful planner
- Fix: Clone form hierarchy and responsive preview table.

## G2-2-020-058  [P2] GAP  facet F17  effort M
- Legacy: Legacy workspaces/new.js:252-267 AntD Modal.confirm keyboard focus
- vNext now: src/components/projects/class-team-workspace-creator.tsx:129-130 native confirm
- Fix: Use shared accessible confirm dialog with count/preview.

## G2-7-020-008  [P2] GAP  facet F02  effort M
- Legacy: new.js:603-635 team preview, cohort preflight and outcome cards beneath form
- vNext now: class-team-workspace-creator.tsx:212-308 renders inline inside planner
- Fix: Place preview and result sections below form, same headings

## G2-7-020-010  [P2] GAP  facet F03  effort M
- Legacy: new.js:414-452 Radio.Group CREATE_MODES with conditional alerts
- vNext now: class-team-workspace-creator.tsx:183-188 separate mode dropdown; single create has no mode
- Fix: Restore segmented mode switch for all three modes

## G2-7-020-016  [P2] GAP  facet F03  effort S
- Legacy: new.js:596-599 Create workspace or Create workspaces for class or Create N team workspaces
- vNext now: project-create-control.tsx:381-394 Create Project; class-team-workspace-creator.tsx:309-313 different labels
- Fix: Match each legacy submit caption

## G2-7-020-017  [P2] GAP  facet F03  effort M
- Legacy: new.js:605-635 advisory preflight table and result card with colored decision tags
- vNext now: class-team-workspace-creator.tsx:212-308 inline DataTable/text result
- Fix: Match status tags, count chips, card headings and structure

## G2-7-020-022  [P2] GAP  facet F04  effort S
- Legacy: new.js:301-307 rosterCount, eligibleCount, alreadyCoveredCount, duplicateRosterEntries in preflight
- vNext now: class-team-workspace-creator.tsx:212-231 toCreate, alreadyCovered, duplicates, eligible
- Fix: Show roster count and all four legacy counters with names

## G2-7-020-024  [P2] GAP  facet F05  effort M
- Legacy: new.js:608-612 preflight columns Learner, Learner ID, Decision, pagination20
- vNext now: class-team-workspace-creator.tsx:216-229 columns Learner and Decision unpaged
- Fix: Restore third column and 20-row pages

## G2-7-020-025  [P2] GAP  facet F05  effort M
- Legacy: new.js:626-634 outcome columns Result, Workspace ID, Workspace/failure; pagination15
- vNext now: class-team-workspace-creator.tsx:275-284 Learner, Result, Workspace no failures
- Fix: Show exact outcomes and 15-row paging

## G2-7-020-026  [P2] GAP  facet F05  effort M
- Legacy: new.js:299-308 confirmation shows first ten uncovered learners
- vNext now: class-team-workspace-creator.tsx:127-131 window.confirm counts only
- Fix: Use 680px preview dialog with first ten learners and totals

## G2-7-020-051  [P2] GAP  facet F09  effort M
- Legacy: new.js:295-315 Modal.confirm width680 with first-ten roster rows
- vNext now: class-team-workspace-creator.tsx:127-131 browser window.confirm with totals only
- Fix: Use accessible dialog with detailed roster sample

## G2-7-020-052  [P2] GAP  facet F09  effort S
- Legacy: new.js:414-452 mode-specific info Alert for teams and cohort
- vNext now: class-team-workspace-creator.tsx:159-163 generic helper; single form has none
- Fix: Match conditional message banners and visual order

## G2-7-020-054  [P2] GAP  facet F09  effort M
- Legacy: new.js:615-635 outcome Card shows warning and downloadable report
- vNext now: class-team-workspace-creator.tsx:266-308 inline report and download button
- Fix: Match modal-free report card layout, warnings and actions

## G2-7-020-068  [P2] GAP  facet F12  effort M
- Legacy: new.js:421-432 clear classId when leaving cohort/teams mode
- vNext now: class-team-workspace-creator.tsx:90-103 mode change rebuilds groups; single control retains sectionId
- Fix: Clear hidden class/learner selections on mode switch

## G2-7-020-073  [P2] GAP  facet F13  effort M
- Legacy: new.js:605-635 reports zero eligible and partial failures
- vNext now: class-team-workspace-creator.tsx:212-231 preflight and :266-284 inline outcome status
- Fix: Restore zero/partial/failure empty states and retry paths

## G2-7-020-074  [P2] GAP  facet F14  effort M
- Legacy: new.js:615-635 project-cohort-outcome.csv with Outcome/Workspace ID/Details and failures
- vNext now: class-team-workspace-creator.tsx:286-307 cohort-creation-outcome.csv with per-learner results
- Fix: Match filename, columns and failure detail rows

## G2-7-020-075  [P2] GAP  facet F14  effort M
- Legacy: new.js:605-612 preflight table page20
- vNext now: class-team-workspace-creator.tsx:215-229 unpaged scroll region
- Fix: Add 20-per-page review

## G2-7-020-081  [P2] GAP  facet F16  effort M
- Legacy: new.js:295-308 width680 roster confirmation, responsive table
- vNext now: class-team-workspace-creator.tsx:127-131 native confirm and :215-229 overflow DataTable
- Fix: Show accessible mobile-size confirm with roster sample

## G2-7-020-082  [P2] GAP  facet F17  effort M
- Legacy: new.js:414-434 Radio create modes keyboard-accessible
- vNext now: class-team-workspace-creator.tsx:183-188 Select changes mode
- Fix: Use radio segmented group and legacy focus order

## G2-7-020-084  [P2] GAP  facet F17  effort M
- Legacy: new.js:295-315 dialog shows title, preview table, confirm and cancel
- vNext now: class-team-workspace-creator.tsx:127-131 window.confirm
- Fix: Use accessible focus-managed modal

## G2-7-020-093  [P2] GAP  facet F19  effort M
- Legacy: new.js:302-308 first10 in modal; 608-612 preflight 20/page
- vNext now: class-team-workspace-creator.tsx:215-229 all rows in scroll region
- Fix: Paginate preflight for big cohorts

## G2-7-020-095  [P2] GAP  facet F20  effort M
- Legacy: new.js:80-88 corrupt/expired report removed
- vNext now: class-team-workspace-creator.tsx:55-57 no persistence or expiration
- Fix: Add expiring report cleanup and corruption protection

## G2-7-020-098  [P2] GAP  facet F20  effort M
- Legacy: new.js:295-316 confirms latest preflight before write
- vNext now: class-team-workspace-creator.tsx:109-119 preflight effect can be stale
- Fix: Revalidate just-in-time before confirmation

## G2-7-020-101  [P2] GAP  facet F21  effort M
- Legacy: new.js:343-345 cohort success redirects to list after storing results
- vNext now: class-team-workspace-creator.tsx:142-147 uses router refresh and navigation
- Fix: Make completion reports rediscoverable after redirect

## G2-7-020-102  [P2] GAP  facet F21  effort M
- Legacy: new.js:186-246 remote integrations for templates/faculty/classes/learners
- vNext now: project-create-control.tsx:78-150 mentor/class/roster APIs, class-team-workspace-creator.tsx:61-119 roster/preflight
- Fix: Provide equivalent searchable integration for each field

## G2-8-028-003  [P2] GAP  facet F01  effort M
- Legacy: Old single mode success pushes new workspace /{id}/summary docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:308-320.
- vNext now: New class/team creator redirects to /admin/projects/{id} or /admin/projects src/components/projects/class-team-workspace-creator.tsx:140-146.
- Fix: Navigate directly to new workspace Summary and avoid redirect-only route.

## G2-8-028-005  [P2] GAP  facet F02  effort M
- Legacy: Old single Card contains mode chips, optional info banner, field form, preview card, outcome card docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:369-407,555-587.
- vNext now: New no encompassing Card, class-team creator continuous layout with instructions, fields, team preview and sticky buttons src/components/projects/class-team-workspace-creator.tsx:159-166,233-315.
- Fix: Align old single canvas/card anatomy and section ordering under shared page shell.

## G2-8-028-007  [P2] GAP  facet F03  effort M
- Legacy: Old mode segmented controls Single, Cohort, Teams from CREATE_MODES docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:35-43,371-390.
- vNext now: New Select mode One team/Split a class/One per student src/components/projects/class-team-workspace-creator.tsx:183-189.
- Fix: Match legacy segmented appearance/order/copy and show Single option.

## G2-8-028-008  [P2] GAP  facet F03  effort M
- Legacy: Old buttons Back to workspaces, Create workspace or class/team-specific variants docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:358-366,548-551.
- vNext now: New sticky Cancel + mode-specific Create team/workspaces actions src/components/projects/class-team-workspace-creator.tsx:309-314.
- Fix: Preserve Back to workspaces wording and single Create workspace path.

## G2-8-028-010  [P2] GAP  facet F03  effort M
- Legacy: Old info banners Split a class into teams and Cohort mode docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:391-402.
- vNext now: New mode=TEAMS shows plain explanatory paragraph with no blue Alert style src/components/projects/class-team-workspace-creator.tsx:160-162.
- Fix: Style help text as legacy alert/banner and preserve exact wording.

## G2-8-028-011  [P2] GAP  facet F03  effort M
- Legacy: Old selected template labels title (vN), mentor names and faculty fallbacks docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:77-100.
- vNext now: New template title · vN and class choices name (code), not remotely searched faculty src/components/projects/class-team-workspace-creator.tsx:171-175.
- Fix: Retain version parenthetical and mentor search labels across creator modes.

## G2-8-028-014  [P2] GAP  facet F04  effort M
- Legacy: Old cohort preflight records rosterCount,eligibleCount,alreadyCoveredCount,duplicateRosterEntries, per-learner IDs docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:240-258,557-564.
- vNext now: New preflight toCreate,alreadyCovered,eligible,duplicates and table learner+decision only src/components/projects/class-team-workspace-creator.tsx:104-118,212-232.
- Fix: Expose all old preflight counters and learner ID in per-row drilldown.

## G2-8-028-016  [P2] GAP  facet F05  effort M
- Legacy: Old learner, mentor, class, template selects search on focus and debounced queries 400ms docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:144-203,443-527.
- vNext now: New class/team page fetches full classes and roster; template options loaded on SSR, selects not searchable src/components/projects/class-team-workspace-creator.tsx:60-89,164-175.
- Fix: Restore searchable selectors and bounded fetch for large colleges.

## G2-8-028-017  [P2] GAP  facet F05  effort M
- Legacy: Old cohort preflight Table uses rowKey learnerId, pagination pageSize20 docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:557-565.
- vNext now: New DataTable in max-height scrolling region, no page size or learner ID column src/components/projects/class-team-workspace-creator.tsx:212-230.
- Fix: Match pagination and visible learner ID to aid reconciliation.

## G2-8-028-018  [P2] GAP  facet F05  effort M
- Legacy: Old outcome Table pagination pageSize15 with columns Result, Workspace ID, Workspace / failure docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:578-585.
- vNext now: New results DataTable Learner,Result,Workspace, unpaginated scroll src/components/projects/class-team-workspace-creator.tsx:274-285.
- Fix: Restore workspace ID and failure detail export/list columns, page size option.

## G2-8-028-020  [P2] GAP  facet F06  effort M
- Legacy: Old Workspace title required max160 showCount placeholder Campus Event Coordination docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:407-416.
- vNext now: New Workspace title unmarked required, max170 placeholder Capstone Project src/components/projects/class-team-workspace-creator.tsx:176-178.
- Fix: Match max160, placeholder, remaining-character counter and required indicator.

## G2-8-028-022  [P2] GAP  facet F06  effort M
- Legacy: Old Template required error A template is required — every workspace needs a sprint/task baseline to start from docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:443-465.
- vNext now: New select auto defaults first assigned template without required inline error src/components/projects/class-team-workspace-creator.tsx:40,171-175.
- Fix: Show explicit required template/empty/unassigned state and exact error.

## G2-8-028-036  [P2] GAP  facet F09  effort M
- Legacy: Old cohort confirmation Modal 680px with roster/eligible/already-covered/duplicate counts, Cancel and Create N workspaces docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:251-265.
- vNext now: New window.confirm bare Create N workspaces? N already covered. src/components/projects/class-team-workspace-creator.tsx:124-131.
- Fix: Use shared Dialog with full counts, action labels and accessibility.

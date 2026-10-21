# Work packet (wave 2): edit src/components/projects/project-workspace.tsx (part 3 of 4)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md, docs/audit/gap2/lane-7/u014-college-admin-workspace-sprints.md, docs/audit/gap2/lane-7/u016-college-admin-workspace-tasks.md, docs/audit/gap2/lane-7/u027-mentor-project-detail.md, docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md

## G2-7-012-010  [P2] GAP  facet F03  effort M
- Legacy: WorkspaceReadinessOverview.jsx:31-43 Tasks complete/Sprints complete/Proof coverage/Submission
- vNext now: project-workspace.tsx:367-408 Tasks/Sprints/Releases/Final submission
- Fix: Match four metric names and positions

## G2-7-012-011  [P2] MISSING  facet F03  effort S
- Legacy: WorkspaceReadinessOverview.jsx:9-13 override icons LockOutlined and UnlockOutlined
- vNext now: project-workspace.tsx:341-416 no override icon
- Fix: Add legacy icon-based status tags

## G2-7-012-015  [P2] GAP  facet F04  effort S
- Legacy: WorkspaceReadinessOverview.jsx:40-42 no submission means Not submitted and empty means em dash
- vNext now: project-workspace.tsx:393-406 defaults to Not started
- Fix: Use Not submitted and legacy placeholder

## G2-7-012-016  [P2] MISSING  facet F04  effort M
- Legacy: WorkspaceReadinessOverview.jsx:85-95 Reason/Set by/Set at with textOrDash and formatTimestamp
- vNext now: project-workspace.tsx:341-416 omits override metadata
- Fix: Display note/actor/date with IST and em dash

## G2-7-012-017  [P2] GAP  facet F04  effort S
- Legacy: adminProjectUtils.js:126-142 projectProgress derived (tasks+sprints) percent rounded and clamped
- vNext now: project-workspace.tsx:364-416 lacks overall percent
- Fix: Restore exact progress arithmetic and fallback

## G2-7-012-018  [P2] GAP  facet F05  effort S
- Legacy: WorkspaceReadinessOverview.jsx:30-74 fixed metric order and no pagination
- vNext now: project-workspace.tsx:364-416 different metric order and no pagination
- Fix: Match order; sorting/paging N/A

## G2-7-012-019  [P2] GAP  facet F05  effort S
- Legacy: WorkspaceReadinessOverview.jsx:76-105 override fields in Reason/Set by/Set at order
- vNext now: project-workspace.tsx:341-416 no override detail list
- Fix: Restore ordered metadata and no-override note

## G2-7-012-041  [P2] MISSING  facet F13  effort S
- Legacy: WorkspaceReadinessOverview.jsx:33-38 No completed tasks yet
- vNext now: project-workspace.tsx:364-416 proof absent
- Fix: Restore zero-completed placeholder

## G2-7-012-045  [P2] GAP  facet F16  effort M
- Legacy: WorkspaceReadinessOverview.jsx:47-74 hero and responsive metrics via CSS classes
- vNext now: project-workspace.tsx:364-416 grid 2 mobile/4 xl no hero
- Fix: Align 375/768/1280 metric layout and hero

## G2-7-012-046  [P2] GAP  facet F16  effort M
- Legacy: WorkspaceReadinessOverview.jsx:76-105 override grid for actor/reason/time
- vNext now: project-workspace.tsx:341-416 missing metadata grid
- Fix: Restore mobile-wrap override grid

## G2-7-012-047  [P2] GAP  facet F17  effort M
- Legacy: WorkspaceReadinessOverview.jsx:47-105 Progress/Alert components text+color
- vNext now: project-workspace.tsx:364-416 Metric strip only
- Fix: Expose labelled progressbar and status text

## G2-7-012-049  [P2] GAP  facet F18  effort S
- Legacy: readiness.js:74 exact Understand submission readiness, proof coverage and any manual override at a glance.
- vNext now: project-workspace.tsx:178-193 generic summary subtitle
- Fix: Restore exact subtitle

## G2-7-012-050  [P2] GAP  facet F18  effort S
- Legacy: WorkspaceReadinessOverview.jsx:50-55 Submission readiness and ready/not-ready headline
- vNext now: project-workspace.tsx:364-416 omits both
- Fix: Restore legacy-copy-B labels

## G2-7-012-051  [P2] GAP  facet F18  effort S
- Legacy: WorkspaceReadinessOverview.jsx:31-42 Tasks complete Sprints complete Proof coverage Submission
- vNext now: project-workspace.tsx:367-408 Tasks Sprints Releases Final submission
- Fix: Use exact metric copy

## G2-7-012-052  [P2] GAP  facet F18  effort S
- Legacy: WorkspaceReadinessOverview.jsx:81-105 Readiness override active Reason Set by Set at no-override sentence
- vNext now: project-workspace.tsx:341-416 omits copy
- Fix: Restore every override label/help message

## G2-7-012-056  [P2] GAP  facet F20  effort S
- Legacy: adminProjectUtils.js:20-69 Jackson UTC timestamp parsing
- vNext now: project-workspace.tsx:341-416 actor timestamp not shown
- Fix: Show override date formatted Asia/Kolkata

## G2-7-012-057  [P2] GAP  facet F20  effort S
- Legacy: adminProjectUtils.js:126-142 round/clamp progress with no-item fallback
- vNext now: project-workspace.tsx:364-416 combined percent missing
- Fix: Replicate percent edge cases 0/0 and 100%

## G2-7-014-010  [P2] GAP  facet F03  effort S
- Legacy: LFE/components/admin/projects/WorkspaceSprintsEditor.jsx:90-100 Add sprint button, Save sprint plan button, footer note
- vNext now: V/components/projects/mentor-sprint-write.tsx:87-102 Add sprint, Confirm create; project-workspace.tsx:887-897 actions
- Fix: Restore `Save sprint plan` and `Only this workspace’s sprint plan is updated.`

## G2-7-016-010  [P2] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceTasksEditor.jsx:24-35 In progress counts IN_PROGRESS and IN_REVIEW, Done counts DONE/COMPLETED
- vNext now: V/modules/projects/readiness-service.ts:93-95 counts DONE only; project-workspace.tsx:364-410 no in-progress statistic
- Fix: Map legacy state aliases and derive both counters

## G2-7-027-005  [P2] GAP  facet F01  effort S
- Legacy: PDC:9448 Back to projects is head action
- vNext now: project-workspace.tsx:315-320 Back to projects inside body
- Fix: Move Back button into page header actions

## G2-7-027-009  [P2] GAP  facet F02  effort S
- Legacy: PDC:9476-9493 archived/read-only alerts before tab content
- vNext now: project-workspace.tsx:348-359 read-only banner within workspace
- Fix: Match banner placement and info style

## G2-7-027-014  [P2] GAP  facet F03  effort S
- Legacy: PDC:9480-9482 heading Archived workspace
- vNext now: project-workspace.tsx:353-357 Archived workspace · read only
- Fix: Use exact alert heading

## G2-7-027-015  [P2] GAP  facet F03  effort S
- Legacy: PDC:9485-9493 role-aware Read-only project access banner
- vNext now: project-workspace.tsx:353-357 generic read-only explanation
- Fix: Show faculty role name and mentor/co-mentor eligibility

## G2-7-027-016  [P2] GAP  facet F03  effort M
- Legacy: PDC:4403-4426 task donut segmented six board lanes
- vNext now: project-workspace.tsx:365-376 four summary Metric rows
- Fix: Add donut, legend, completion percent and board lane labels

## G2-7-027-018  [P2] GAP  facet F03  effort M
- Legacy: PDC:9593-9608 Add/Edit sprint modal width560
- vNext now: project-workspace.tsx:813-960 uses inline new-sprint/edit controls
- Fix: Match legacy dialog placement and dimensions

## G2-7-027-019  [P2] GAP  facet F04  effort S
- Legacy: PDC:9440-9445 subtitle includes available course and mentor or Project workspace fallback
- vNext now: project-workspace.tsx:185-190 always Course not linked · Mentor: Not assigned fallback
- Fix: Use conditional subtitle, avoid extra unavailable labels

## G2-7-027-020  [P2] GAP  facet F04  effort M
- Legacy: PDC:4385-4392 goal/deliverables/definitionOfDone/personas/nextAction
- vNext now: project-workspace.tsx:242-249 authored brief, :460-500 completion conditions and personas
- Fix: Map legacy nextAction and field fallback semantics

## G2-7-027-021  [P2] GAP  facet F04  effort M
- Legacy: PDC:4403-4426 rounded completed/total donut progress per lane
- vNext now: project-workspace.tsx:365-376 summary metrics, :1027-1095 task details
- Fix: Reproduce same calculation and precision

## G2-7-027-023  [P2] GAP  facet F04  effort S
- Legacy: PDC:7148-7334 meeting time in viewer timezone and GMT offset
- vNext now: project-workspace.tsx:167-174 formats dates in fixed Asia/Kolkata
- Fix: Document required IST override and compare timezone labels

## G2-7-027-034  [P2] GAP  facet F06  effort M
- Legacy: PDC:9593-9608 Sprint form modal title Add release / Add sprint and explanation
- vNext now: project-workspace.tsx:813-950 inline release/sprint authoring
- Fix: Match modal affordance and default linked release

## G2-7-027-043  [P2] GAP  facet F09  effort M
- Legacy: PDC:9498-9550 Edit about this project uses ProjectModalShell width920
- vNext now: project-workspace.tsx:469-472 inline brief/about editors
- Fix: Recreate modal shell geometry and Cancel semantics

## G2-7-027-044  [P2] GAP  facet F09  effort M
- Legacy: PDC:9593-9608 Add/Edit sprint modal width560
- vNext now: project-workspace.tsx:813-950 nested sprint controls
- Fix: Use matching modal and contents

## G2-7-027-054  [P2] GAP  facet F11  effort S
- Legacy: PDC:9485-9493 faculty read-only banner names role, Project Mentor and Co-Mentor
- vNext now: project-workspace.tsx:353-357 generic read-only text
- Fix: Include actual role and specific edit rule

## G2-7-027-058  [P2] GAP  facet F12  effort M
- Legacy: PDC:4403-4426 six-lane completion/Math.round percentage
- vNext now: project-workspace.tsx:365-376 metrics, no identical donut
- Fix: Match rounding and progress segmentation

## G2-7-027-074  [P2] GAP  facet F18  effort S
- Legacy: PDC:9440-9445 fallback Project workspace
- vNext now: project-workspace.tsx:185-190 fallback Course not linked / Mentor: Not assigned
- Fix: Restore legacy missing-context copy

## G2-7-027-092  [P2] GAP  facet F22  effort M
- Legacy: PDC:4385-4392 definitionOfDone/personas/nextAction
- vNext now: project-workspace.tsx:242-249 authored brief completionConditions/personas; no explicit nextAction in inspected view
- Fix: Crosswalk and expose nextAction and definitionOfDone

## G2-12-028-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:19-22,61-66 SuperAdminLayout /superadmin/projects/workspaces/{workspaceId}/team with selected college scope
- vNext now: src/components/projects/admin-project-section-page.tsx:19-75 ADMIN team via /admin/projects/{projectId}/team equivalent; src/components/projects/project-workspace.tsx:75-105 ten tabs
- Fix: Keep legacy team deep link redirect and tab order/labels in shell

## G2-12-028-003  [P2] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTeamOverview.jsx:51-75 four metrics under Team at a glance heading
- vNext now: src/components/projects/project-workspace.tsx:682-799 immediately renders Project people and roster cards, no snapshot metrics
- Fix: Add glance heading, explanatory subtitle, four metric cells before roster

## G2-12-028-004  [P2] MISSING  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTeamOverview.jsx:78-85 warning when no primary mentor
- vNext now: src/components/projects/project-workspace.tsx:711-715 only shows missing-primary warning for MENTOR mode
- Fix: Show warning to ADMIN mode too when primary mentor absent

## G2-12-028-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/WorkspaceTeamOverview.jsx:88-101 team-group notice then Team roster card with search/filter table
- vNext now: src/components/projects/project-workspace.tsx:725-800 group note then member grid only
- Fix: Restore group notice and roster table section order

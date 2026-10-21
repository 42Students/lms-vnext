# Work packet: edit src/db/schema/projects.ts (part 6 of 6)

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u021-college-admin-mentor-reassignment.md, docs/audit/gap2/lane-7/u029-superadmin-at-risk.md, docs/audit/gap2/lane-8/l19-u028-superadmin-workspace-meetings.md, docs/audit/gap2/lane-20/project-meeting.md, docs/audit/gap2/lane-6/project-template-college.md

## G2-7-021-093  [P1] GAP  facet F22  effort M
- Legacy: reassign-mentor.js:109 lifecycle ARCHIVED excluded
- vNext now: projects.ts:195-198 status and :249-252 check PLANNED ACTIVE COMPLETED ARCHIVED
- Fix: Map old ACTIVE/READY/IN_PROGRESS/BLOCKED status to vNext before filter and workload

## G2-7-029-093  [P1] GAP  facet F22  effort L
- Legacy: superadmin/projects/at-risk/index.js:237-298 eight columns from ProjectWorkspaceDTO, status ACTIVE/IN_PROGRESS/READY/BLOCKED/ARCHIVED
- vNext now: projects.ts:249-252 project_instances allowed PLANNED/ACTIVE/COMPLETED/ARCHIVED
- Fix: Map legacy READY/BLOCKED statuses to new independent risk reasons and display status

## G2-19-028-022  [P1] GAP  facet F22  effort M
- Legacy: meetings.js:68-72 meetingsList JSON workspace update
- vNext now: projects.ts:1104-1215 project_meetings UUID relational rows
- Fix: Write field/status migration

## G2-20-017-020  [P2] MISSING  facet F07  effort S
- Legacy: Legacy calendar_sync_error varchar500 shown via DTO [L:146-157,D:46-47]
- vNext now: No calendar sync error field/status in new model `src/db/schema/projects.ts:1104-1174`
- Fix: If calendar delivery unsupported, remove misleading sync UI and explain manually entered links

## G2-6-017-017  [P2] GAP  facet F07  effort S
- Legacy: Legacy DB unique violation named uk_project_template_college (V140__project_template_college_assignment.sql:12-14).
- vNext now: vNext maps active unique conflict to PROJECT_TEMPLATE_ASSIGNMENT_CONFLICT (template-service.ts:40-51; projects.ts:158-162).
- Fix: Map conflict code to old duplicate-assignment message; preserve exact UI state.

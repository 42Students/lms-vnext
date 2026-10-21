# Work packet: edit src/components/projects/college-project-mentor-dialog.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md

## G2-12-028-015  [P1] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:348-358 mentor Select searchable by faculty name, not preselected
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:32-42,73-85 explicit search with auto-preselection of first mentor
- Fix: Start with no selection and search as typed; avoid silently assigning first option

## G2-12-028-025  [P1] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:326-372 mentor modal warning lists cancelled meetings, unassigned tasks, both mentors notified
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:69-99 has generic description and 'may change' impact
- Fix: Show specific impact warning and confirmation before submit

## G2-12-028-049  [P1] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:153-190 preserves selections on remote search and stale sequence
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:39 can reset mentor to first on searching; src/components/projects/college-project-student-roster-dialog.tsx:58 preserves learner options
- Fix: Preserve selected mentor while searching even if result page excludes them; ignore stale responses

## G2-12-028-020  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:348-348 required mentor validation message 'Mentor is required'
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:96-97 only disabled submit, no field-level error
- Fix: Add required-message display for unselected mentor

## G2-12-028-022  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:125,136,174,189 remote option-loading errors specific faculty vs learner
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:40-42 generic mentors, src/components/projects/college-project-student-roster-dialog.tsx:49,59 generic learner errors
- Fix: Use exact failed-to-load/search messages and separate initial load/search states

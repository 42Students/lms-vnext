# Work packet: edit src/components/projects/college-project-student-roster-dialog.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md

## G2-12-028-017  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:389-392,452-462 replaceExisting unchecked by default; append supported
- vNext now: src/components/projects/college-project-student-roster-dialog.tsx:44-48,62-69 initializes all selected and always replaces
- Fix: Offer append-vs-replace mode with equivalent selection UX

## G2-12-028-018  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:437-447 multi Select maxCount 500 and live remote search
- vNext now: src/components/projects/college-project-student-roster-dialog.tsx:90-105 explicit search, checkbox group; src/modules/projects/college-project-roster-model.ts:3-4 max100
- Fix: Raise roster capacity to 500 with virtualized options and correct total cap checks

## G2-12-028-021  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:410-435 required Students and detailed cap error 'This would exceed the 500-learner limit...'
- vNext now: src/modules/projects/college-project-roster-model.ts:2-7 Zod max100 generic; src/components/projects/college-project-student-roster-dialog.tsx:113-116 no inline cap explanation
- Fix: Use 500 effective total cap and legacy computed inline error

## G2-12-028-029  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:264-269 POST /api/v1/admin/projects/{workspaceId}/learners with learnerIds,replaceExisting,roleLabel
- vNext now: src/components/projects/college-project-student-roster-dialog.tsx:66-69 POST /api/projects/{id}/roster with learnerMembershipIds,roleLabel,expectedUpdatedAt; replacement always
- Fix: Support append mode in API and retain optimistic conflict guard

## G2-12-028-049  [P1] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:153-190 preserves selections on remote search and stale sequence
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:39 can reset mentor to first on searching; src/components/projects/college-project-student-roster-dialog.tsx:58 preserves learner options
- Fix: Preserve selected mentor while searching even if result page excludes them; ignore stale responses

## G2-12-028-022  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:125,136,174,189 remote option-loading errors specific faculty vs learner
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:40-42 generic mentors, src/components/projects/college-project-student-roster-dialog.tsx:49,59 generic learner errors
- Fix: Use exact failed-to-load/search messages and separate initial load/search states

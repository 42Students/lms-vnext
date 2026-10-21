# Work packet (wave 2): edit src/components/projects/college-project-student-roster-dialog.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md

## G2-12-028-026  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:374-465 manage modal has replace warning, already-member info, checkbox and 500-cap validation
- vNext now: src/components/projects/college-project-student-roster-dialog.tsx:85-126 dialog with list and role label, no append checkbox or selected-already info
- Fix: Restore missing conditional notices and append control

## G2-12-028-027  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:251-260 replace confirmation only if removed learners, with names and preserved-work text
- vNext now: src/components/projects/college-project-student-roster-dialog.tsx:120-123 always ConfirmDialog including when removeCount=0, no removed names
- Fix: Show destructive confirmation only for removals and list names

## G2-12-028-038  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:163-191 sequence numbers avoid stale async search overwrites
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:32-43 and src/components/projects/college-project-student-roster-dialog.tsx:52-61 searching booleans, no request generation token
- Fix: Guard against out-of-order remote search completions and preserve selected option labels

## G2-12-028-051  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:246-261 confirmation lists removals by name
- vNext now: src/components/projects/college-project-student-roster-dialog.tsx:81-83 and 120-123 count only; pure-append still opens removal dialog
- Fix: Do not show destructive modal for zero removal; add removal-name preview

## G2-12-028-052  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:123-145 calls AdminService faculty/learner search APIs
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:36-42, src/components/projects/college-project-student-roster-dialog.tsx:40-60 fetch project-specific candidates
- Fix: Confirm equivalent inactive account, tenant, class and mentor eligibility filters in candidate API

## G2-12-028-056  [P2] GAP  facet F23  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:251-260 delete confirmation only on removing old learner
- vNext now: src/components/projects/college-project-student-roster-dialog.tsx:120-123 confirmation always, including add-only; src/modules/projects/college-project-roster-service.ts:68-72 idempotent no-op
- Fix: Keep idempotent back end but restore conditional confirmation semantics

## G2-12-028-006  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:317-322 header actions 'Reassign mentor…' and 'Manage students…' with icons
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:65-67 and src/components/projects/college-project-student-roster-dialog.tsx:83-86 buttons lack ellipses/icons
- Fix: Use exact action labels/icon affordances; preserve disabled archived state

## G2-12-028-019  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:449-451 role label placeholder Project Contributor
- vNext now: src/components/projects/college-project-student-roster-dialog.tsx:107-109 roleLabel input has no placeholder
- Fix: Add exact placeholder

## G2-12-028-046  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:317-322 buttons with ellipsis and students wording
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:65-67 'Reassign mentor', src/components/projects/college-project-student-roster-dialog.tsx:83-86 'Manage students'
- Fix: Match punctuation exactly

# Work packet (wave 2): edit src/components/projects/college-project-mentor-dialog.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md

## G2-12-028-028  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:230-234 POST /api/v1/admin/projects/{workspaceId}/mentor with collegeId,mentorId,roleLabel
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:50-52 POST /api/projects/reassign-mentor with projectIds:[id], mentorMembershipId and roleLabel
- Fix: Map caller and backend single-project semantics and errors, not merely bulk target

## G2-12-028-038  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:163-191 sequence numbers avoid stale async search overwrites
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:32-43 and src/components/projects/college-project-student-roster-dialog.tsx:52-61 searching booleans, no request generation token
- Fix: Guard against out-of-order remote search completions and preserve selected option labels

## G2-12-028-052  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:123-145 calls AdminService faculty/learner search APIs
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:36-42, src/components/projects/college-project-student-roster-dialog.tsx:40-60 fetch project-specific candidates
- Fix: Confirm equivalent inactive account, tenant, class and mentor eligibility filters in candidate API

## G2-12-028-002  [P3] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:367-370 bulk reassign link inside mentor modal
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:65-101 no bulk link in dialog; src/components/projects/project-workspace.tsx:695-700 bulk link outside
- Fix: Expose bulk reassign link within mentor dialog as legacy does

## G2-12-028-006  [P3] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:317-322 header actions 'Reassign mentor…' and 'Manage students…' with icons
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:65-67 and src/components/projects/college-project-student-roster-dialog.tsx:83-86 buttons lack ellipses/icons
- Fix: Use exact action labels/icon affordances; preserve disabled archived state

## G2-12-028-016  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:360-365 optional role label placeholder Project Mentor tooltip about roster label
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:88-90 placeholder Project Mentor but no tooltip
- Fix: Add legacy tooltip exact explanation

## G2-12-028-046  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/team.js:317-322 buttons with ellipsis and students wording
- vNext now: src/components/projects/college-project-mentor-dialog.tsx:65-67 'Reassign mentor', src/components/projects/college-project-student-roster-dialog.tsx:83-86 'Manage students'
- Fix: Match punctuation exactly

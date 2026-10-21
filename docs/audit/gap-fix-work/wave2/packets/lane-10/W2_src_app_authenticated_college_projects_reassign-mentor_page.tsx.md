# Work packet (wave 2): edit src/app/(authenticated)/college/projects/reassign-mentor/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u021-college-admin-mentor-reassignment.md

## G2-7-021-001  [P2] GAP  facet F01  effort S
- Legacy: reassign-mentor.js:359-372 route /college-admin/projects/workspaces/reassign-mentor, project shell with back to workspaces
- vNext now: college/projects/reassign-mentor/page.tsx:6-25 /college/projects/reassign-mentor, wrapper
- Fix: Redirect legacy route and match Back to workspaces target

## G2-7-021-051  [P2] GAP  facet F11  effort S
- Legacy: reassign-mentor.js:341-356 missing college warning under AdminGroupShell
- vNext now: college/projects/reassign-mentor/page.tsx:16-18 ProjectAdminMissingCollege
- Fix: Match warning message and tab-preserving shell

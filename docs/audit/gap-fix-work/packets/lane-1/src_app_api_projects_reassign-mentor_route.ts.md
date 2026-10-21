# Work packet: edit src/app/api/projects/reassign-mentor/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-projects-workspaces-reassign-mentor.md

## G2-6-028-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy POST /api/v1/admin/projects/reassign-mentor/bulk sends {collegeId,projectIds,mentorId,roleLabel} (AdminService.js:?, AdminProjectBulkMentorReassignDTO.java:7-13; AdminProjectController.java:475-488).
- vNext now: vNext POST /api/projects/reassign-mentor sends {collegeId,projectIds,mentorMembershipId,roleLabel} (project-mentor-reassignment.tsx:128-137; projects/reassign-mentor/route.ts:9-26).
- Fix: Map numeric mentorId and UUID membershipId, ensure auth-scope and bulk consumers use new contract.

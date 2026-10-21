# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u017-college-admin-workspace-team.md (part 2 of 2)

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u017-college-admin-workspace-team.md

## G2-7-017-082  [P2] GAP  facet F22  effort M
- Legacy: LBE/dto/projects/AdminProjectMentorAssignDTO.java:6-10 mentorId int, collegeId int, roleLabel
- vNext now: V/components/projects/college-project-mentor-dialog.tsx:44-52 mentorMembershipId UUID, projectIds UUID[] and scope ID UUID
- Fix: Map legacy faculty ID to actual active membership and maintain same-college rule

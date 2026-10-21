# Work packet: edit src/modules/people/learner-profile-access-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md

## G2-1-004-039  [P1] GAP  facet F11  effort L
- Legacy: `LearnerProfileController.java:64-105` learner self, staff/admin access guarded by teaching assignment.
- vNext now: `learner-profile-access-service.ts:9-24` self-only selected learner membership.
- Fix: Implement scoped authorized staff/teacher read with teaching guard separately from self write.

## G2-1-004-030  [P2] GAP  facet F07  effort M
- Legacy: `LearnerProfileController.java:125-127` identity denial says restricted to learner and college administrators.
- vNext now: `learner-profile-access-service.ts:9-24` self-only; admin/private identity routed elsewhere.
- Fix: Ensure identity routes surface role-specific denial and recovery.

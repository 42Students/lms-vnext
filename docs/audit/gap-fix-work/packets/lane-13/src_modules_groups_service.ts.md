# Work packet: edit src/modules/groups/service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/learner-group-controller.md, docs/audit/gap2/lane-4/elective-admin-controller.md

## G2-20-023-002  [P1] GAP  facet F01  effort M
- Legacy: Legacy platform open groups `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/LearnerGroupController.java:75-82`
- vNext now: SELF requires college group `src/modules/groups/service.ts:48-56`
- Fix: Allow eligible platform groups

## G2-4-024-028  [P1] GAP  facet F06  effort M
- Legacy: Legacy allocation can specify learnerIds, rollNumbers, fromClassId, note (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/electives/ElectiveRequests.java:38-45`)
- vNext now: New group service general membership actions by membership UUID, no roll/class batch parser shown (`src/modules/groups/service.ts:78-95`)
- Fix: Restore all three selection modes and free-text note, with cross-college validation.

## G2-4-024-045  [P1] GAP  facet F10  effort M
- Legacy: Legacy allocate non-transactional per learner, returns partial failures (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/electives/ElectiveService.java:469-545`)
- vNext now: New group kernel transactional per member and active selection policy (`src/modules/groups/service.ts:112-134`)
- Fix: Preserve partial-results UX for batches without data inconsistencies.

## G2-20-023-010  [P2] GAP  facet F07  effort S
- Legacy: 403 Learners only `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/groups/LearnerGroupController.java:50-53`
- vNext now: GROUP_SELF_ACCESS_DENIED `src/modules/groups/service.ts:48-56`
- Fix: Map exact error copy

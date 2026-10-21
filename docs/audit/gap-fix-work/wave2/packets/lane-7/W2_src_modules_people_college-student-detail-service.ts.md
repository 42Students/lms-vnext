# Work packet (wave 2): edit src/modules/people/college-student-detail-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u019-learner.md

## G2-5-019-007  [P2] GAP  facet F03  effort S
- Legacy: Legacy department free-text `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:76-77`
- vNext now: VNext programs/departments from enrollment joins `src/modules/people/college-student-detail-service.ts:50-68`
- Fix: Preserve historical department label in display.

## G2-5-019-033  [P2] GAP  facet F05  effort M
- Legacy: Legacy counts active learners by class/program, excludes suspended `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerRepository.java:14-27`
- vNext now: VNext membership status + section/program join `src/db/schema/memberships.ts:19-43` `src/modules/people/college-student-detail-service.ts:50-90`
- Fix: Rebuild active blast-radius counters using persisted status.

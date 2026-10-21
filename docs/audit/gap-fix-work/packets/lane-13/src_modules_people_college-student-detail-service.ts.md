# Work packet: edit src/modules/people/college-student-detail-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u019-learner.md

## G2-5-019-014  [P1] GAP  facet F04  effort L
- Legacy: Legacy classId and programId direct on row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:49-56`
- vNext now: VNext separate section/program enrollments `src/modules/people/college-student-detail-service.ts:50-90`
- Fix: Map correct active class, cohort and semester, not just current row.

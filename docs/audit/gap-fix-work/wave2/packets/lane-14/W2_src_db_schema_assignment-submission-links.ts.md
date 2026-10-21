# Work packet (wave 2): edit src/db/schema/assignment-submission-links.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/student-assignment.md

## G2-3-016-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:35-45`
- vNext now: `src/db/schema/assessments.ts:156-162`, `src/db/schema/assignment-submission-links.ts:5-15`
- Fix: Legacy gradingDate string, HTML answer, submissionLink, submissionAssets JSON list; vNext timestamp gradedAt, textContent, submissionUrl and normalized link/file children. Map rich HTML and multi-part assets.

## G2-3-016-039  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/StudentAssignmentDTO.java:20-24`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:345-360`
- vNext now: `src/db/schema/assignment-submission-links.ts:5-15`
- Fix: Legacy asset link requires http/https and may be repository or external; vNext link table kind constrained REPOSITORY_LINK/EXTERNAL_LINK with max20 items. Align validation and privacy checks.

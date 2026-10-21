# Work packet: edit src/modules/people/college-role-directory-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/learner-search-controller.md

## G2-15-013-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy result fields id/firstName/lastName/uniqueId/rollNumber/contactMail/contactMobile/department/college/program/class/organization. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/learners/LearnerSearchDTO.java:19-34`)
- vNext now: New role directory row membershipId,name,email/status/userStatus/joined/program/cohort/sections. (`src/modules/people/college-role-directory-model.ts:47-58`)
- Fix: Build complete approved learner search DTO including roll, program, section, unique/registration ID, scoped contact.

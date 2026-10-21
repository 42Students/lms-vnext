# Work packet (wave 2): edit src/db/schema/placement-recruiter-public-contacts.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/recruiter.md

## G2-15-016-061  [P2] GAP  facet F20  effort M
- Legacy: Mobile unique across soft-deleted recruiters. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Recruiter.java:37-48`)
- vNext now: Public contact phone unique only per recruiterUserId, not globally. (`src/db/schema/placement-recruiter-public-contacts.ts:12-27`)
- Fix: Clarify public contact duplication policy vs verified login phone uniqueness.

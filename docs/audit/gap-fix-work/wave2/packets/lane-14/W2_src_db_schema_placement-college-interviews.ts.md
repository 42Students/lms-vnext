# Work packet (wave 2): edit src/db/schema/placement-college-interviews.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u002-college-admin-calendar.md

## G2-5-002-069  [P2] GAP  facet F22 Models/migrations  effort M
- Legacy: Modes ONLINE/OFFLINE, free text venue/link. (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:69-79)
- vNext now: Proposed VIRTUAL/ON_CAMPUS constrained venue/URL. (src/db/schema/placement-college-interviews.ts:14-17; src/db/schema/placement-college-interviews.ts:34-38)
- Fix: Map legacy data and preserve arbitrary venue where safe.

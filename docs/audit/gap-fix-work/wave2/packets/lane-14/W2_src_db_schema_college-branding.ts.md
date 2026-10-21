# Work packet (wave 2): edit src/db/schema/college-branding.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u020-college.md, docs/audit/gap2/lane-2/l15-u020-college-branding.md

## G2-16-020-026  [P2] GAP  facet F14  effort S
- Legacy: College.java:18-19 logo stored as text; no file upload in entity.
- vNext now: college-branding.ts:33-35 logo URL; separate logo upload service.
- Fix: Ensure signed safe branding upload/preview path.

## G2-15-020-001  [P2] GAP  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeBranding.java:9-15 unique legacy college_id integer
- vNext now: src/db/schema/college-branding.ts:27-32 college UUID primary FK
- Fix: Map legacy college ID to new UUID during import.

## G2-15-020-018  [P2] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:23-37 int ID and is_deleted
- vNext now: src/db/schema/college-branding.ts:30-49 college UUID PK and version, no is_deleted
- Fix: Map deleted legacy branding/history during import.

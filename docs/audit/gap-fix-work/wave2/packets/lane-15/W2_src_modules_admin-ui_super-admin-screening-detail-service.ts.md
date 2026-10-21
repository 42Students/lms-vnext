# Work packet (wave 2): edit src/modules/admin-ui/super-admin-screening-detail-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u021-application-screening-entity.md

## G2-13-021-024  [P2] GAP  facet F09  effort M
- Legacy: Legacy screening provenance displayed in application detail where authorized. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:119-146`
- vNext now: vNext hides private reasoning from superadmin detail. `src/modules/admin-ui/super-admin-screening-detail-service.ts:27-35`
- Fix: Provide redacted audit record without sensitive applicant data.

## G2-13-021-044  [P2] GAP  facet F18  effort M
- Legacy: Legacy explanatory text says partial score or excluded attributes. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ApplicationScreening.java:78-102`
- vNext now: vNext privacy text only `Internal review notes ... not shown`. `src/modules/admin-ui/super-admin-screening-detail-service.ts:27-35`
- Fix: Explain omitted score reason or explicitly mark retired.

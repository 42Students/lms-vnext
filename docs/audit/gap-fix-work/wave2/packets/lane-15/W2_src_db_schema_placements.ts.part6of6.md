# Work packet (wave 2): edit src/db/schema/placements.ts (part 6 of 6)

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-companies-college.md, docs/audit/gap2/lane-9/superadmin-company-curation.md, docs/audit/gap2/lane-1/l15-u019-industry-company.md, docs/audit/gap2/lane-20/job-application-status-history-service-impl.md, docs/audit/gap2/lane-3/job-application-status-history-service.md

## G2-9-033-101  [P2] GAP  facet F22  effort M
- Legacy: Company public industry100, description2000, logo/website500 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:38-52`
- vNext now: industry160, about text, logoPublicUrl text `src/db/schema/placements.ts:23-35`
- Fix: Align lengths and field names across API and constraints.

## G2-9-034-027  [P2] GAP  facet F10  effort M
- Legacy: Legacy global verify POST id/verify toggles verified and domain verified flag; invalidates search `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminCompanyController.java:53-56` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:67-76`
- vNext now: New POST /api/admin/companies/verification invoked for verified state; company verifiedAt field `src/components/admin/super-admin-company-verification.tsx:13-22` `src/db/schema/placements.ts:34-38`
- Fix: Check verification propagates across all domains and recruiter drive company matching

## G2-15-019-024  [P3] GAP  facet F17  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/IndustryCompany.java:23-24 — name nonnull but no entity-side error message
- vNext now: src/db/schema/placements.ts:27,59-61 — NOT NULL + unique name
- Fix: Ensure accessible required and duplicate-name messages at form boundary

## G2-20-011-012  [P3] GAP  facet F06  effort S
- Legacy: rejectionReason truncated to 500 characters `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:44-46`
- vNext now: reason text not constrained by schema `src/db/schema/placements.ts:1078-1082`
- Fix: Define standardized max length at service boundary and UI helper

## G2-3-013-027  [P3] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:44-46`
- vNext now: `src/db/schema/placements.ts:1073-1087`
- Fix: Legacy rejectionReason truncates to 500 preserving whitespace except blank filter; vNext free text reason is nullable and has no max at column level. Match 500 for equivalent public reason.

## G2-3-013-038  [P3] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V40__job_application_status_history.sql:15-17`
- vNext now: `src/db/schema/placements.ts:1090-1095`, `drizzle/0021_placements_p5_application_history.sql:17-17`
- Fix: Legacy indexes application_id and changed_at separately, vNext compound application_id/created_at index and cascade partial index. Confirm query plans, preserve stable asc ordering.

# Work packet: edit src/db/schema/placements.ts (part 15 of 15)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-companies-college.md, docs/audit/gap2/lane-9/superadmin-company-curation.md, docs/audit/gap2/lane-12/job-application.md, docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-20/job-application-status-history-service-impl.md, docs/audit/gap2/lane-3/job-application-status-history-service.md

## G2-9-033-013  [P1] GAP  facet F04  effort L
- Legacy: Legacy duplicate company names permitted after domain-global V202 migration `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19`
- vNext now: New placement_companies lower(name) unique across platform `src/db/schema/placements.ts:59-64`
- Fix: Allow distinct real companies with same name but distinct verified domains; move unique identity to domain

## G2-9-033-052  [P1] GAP  facet F22  effort L
- Legacy: Legacy V202 one shared company, domains unique per domain, college_company has private notes contacts & owner `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:21-60`
- vNext now: New placement_companies and placement_company_relationships include trust owner and status; no private contact/notes columns on relationship `src/db/schema/placements.ts:23-155`
- Fix: Add permissioned college CRM contact/notes model or record deliberate data feature removal

## G2-9-033-053  [P1] GAP  facet F22  effort L
- Legacy: Legacy V202 allows same company name for distinct global identities by domain `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:30-42`
- vNext now: New lower(name) unique, primaryDomain unique if non-null `src/db/schema/placements.ts:59-65`
- Fix: Remove name-global uniqueness and enforce canonical identity/domain rules

## G2-9-034-012  [P1] GAP  facet F04  effort L
- Legacy: Legacy duplicate company names permitted after domain-global V202 migration `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19`
- vNext now: New placement_companies lower(name) unique across platform `src/db/schema/placements.ts:59-64`
- Fix: Allow distinct real companies with same name but distinct verified domains; move unique identity to domain

## G2-9-034-047  [P1] GAP  facet F19  effort L
- Legacy: Old global companies with same name but different domain both listed distinct IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyCurationService.java:35-65` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-15`
- vNext now: New query joins and repeats one company on multiple colleges, and schema enforces unique lower(name) `src/modules/placements/admin-company-directory-service.ts:68-112` `src/db/schema/placements.ts:59-64`
- Fix: Redesign distinct identity listing independent of relationship rows

## G2-9-034-053  [P1] GAP  facet F22  effort L
- Legacy: Legacy V202 allows same company name for distinct global identities by domain `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19` `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:30-42`
- vNext now: New lower(name) unique, primaryDomain unique if non-null `src/db/schema/placements.ts:59-65`
- Fix: Remove name-global uniqueness and enforce canonical identity/domain rules

## G2-9-034-097  [P1] GAP  facet F12  effort L
- Legacy: Legacy domain owned by company unique after V202; same names can belong to distinct companies `docs/legacy-source/backend/src/main/resources/db/migration/V202__company_global_with_domains.sql:14-19`
- vNext now: New lower(name) unique index, and edit duplicate-name rejection `src/db/schema/placements.ts:59-64`; `src/modules/placements/super-admin-company-edit-service.ts:25-28`
- Fix: Drop name uniqueness, key canonical identity by verified domain.

## G2-12-019-028  [P2] GAP  facet F07  effort S
- Legacy: Old company/publicRef automatically generated at persist `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:177-188`
- vNext now: New UUID generated DB and none of same public reference format `src/db/schema/placements.ts:973-977`
- Fix: Guarantee immutable publicRef generation and uniqueness.

## G2-12-019-030  [P2] GAP  facet F07  effort S
- Legacy: Old applicationStatus potentially represents OFFERED/HIRED in same field `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- vNext now: New submitted status only + offer and joining states separate `src/db/schema/placements.ts:993-995,1526-1608`
- Fix: Map invalid transitions across offer and stage services with equivalent error.

## G2-12-019-031  [P2] GAP  facet F08  effort S
- Legacy: Legacy offer accepted triggers HIRED status and notifications `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:104-112`
- vNext now: New offer release and status messaging through event delivery and separate offer object `src/db/schema/placements.ts:1526-1608` `src/modules/placements/learner-placement-event-delivery.ts:13-35`
- Fix: Restore exact offer status copy in learner timeline.

## G2-18-011-025  [P2] MISSING  facet F07  effort M
- Legacy: Legacy resumeUrl >2048 error `Resume URL must be at most 2048 characters` (`JobServiceImpl.java:400-405`).
- vNext now: New app input has no raw resumeUrl (role/channel input) and schema no resume field (`application-service.ts:570-616`; `placements.ts:973-1020`).
- Fix: Add secure resume picker and exact length validation at API boundary.

## G2-20-011-013  [P2] GAP  facet F07  effort S
- Legacy: Null applicationId/newStatus silently skipped with warn `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-33`
- vNext now: UUID application and required constrained toStatus fail at DB/route validation `src/db/schema/placements.ts:1067-1075`
- Fix: Return structured validation error to caller where writer invalid instead of silently missing audit

## G2-20-011-014  [P2] GAP  facet F07  effort S
- Legacy: Repeated status change ignored case-insensitively `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:34-36`
- vNext now: DB transition ck disallows from same state; service behavior differs `src/db/schema/placements.ts:1105-1108`
- Fix: Handle idempotent duplicate transitions without 500 or creating redundant events

## G2-3-013-016  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:29-36`
- vNext now: `src/db/schema/placements.ts:1096-1109`, `src/modules/placements/application-service.ts:848-882`
- Fix: Legacy invalid/null applicationId or newStatus silently skips record with warn, and no-op for case-insensitive same status; vNext DB rejects constraint/shape errors. Add typed, non-lossy handling/idempotency.

## G2-13-019-015  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:159-164`
- vNext now: `src/db/schema/placements.ts:489-495`
- Fix: Soft candidate preferences JSON validates differently from typed legacyPostingDetails subset.

## G2-13-019-016  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:269-275`
- vNext now: `src/db/schema/placements.ts:544-545`
- Fix: Old @Version JPA bigint optimistic token replaced by updatedAt; no same version in placement_jobs.

## G2-13-019-017  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:315-324`
- vNext now: `src/db/schema/placements.ts:534-545`
- Fix: Old lastSavedByFaculty/name/at editing status not represented as identical columns.

## G2-13-025-016  [P2] GAP  facet F07  effort S
- Legacy: Old collegeId Integer path, actor from principal `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:20-29`
- vNext now: New grant relationship UUID `src/db/schema/placements.ts:206-220`
- Fix: Validate UUID collegeId path against server relation, never client recruiter id.

## G2-13-025-017  [P2] MISSING  facet F08  effort S
- Legacy: Accept service returns ok; frontend must refresh now-active college `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:25-26`
- vNext now: No pending success toast/UI NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Refresh recruiter session scope; exact success copy live-check.

## G2-13-025-018  [P2] MISSING  facet F08  effort S
- Legacy: Decline service returns ok and removes pending row `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:28-29`
- vNext now: No pending decline confirmation/error banner NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Render success/failure and remove resolved pending card.

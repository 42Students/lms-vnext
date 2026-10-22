# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-13-012-011 [P1] GAP facet F06
- Files: src/modules/placements/public-join/send-code-service.ts, src/modules/placements/tpo-company-domain-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:90-102` requireMail flag permits skipping DNS when false
- Expected fix: Expose requireMail boolean per caller and document when true/false instead of inconsistent behavior

## G2-13-012-014 [P1] GAP facet F07
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/MailDomainResolver.java:10-12` UNKNOWN means do not block on timeout/failure; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:101-102` only NO_MAIL blocks
- Expected fix: Implement fail-open on DNS UNKNOWN for company validation if required; explicitly risk-assess OTP send before allowing proceed

## G2-13-012-016 [P1] GAP facet F07
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:76` timeout/communication exceptions rethrown then UNKNOWN
- Expected fix: Distinguish timed-out/temporary network failures from confirmed no-mail and return UNKNOWN

## G2-13-012-019 [P1] GAP facet F10
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:47-54` JNDI DnsContextFactory asks MX then A then AAAA serially and short-circuits
- Expected fix: Add RFC fallback A and AAAA queries when no MX, preserving error classification and short-circuiting

## G2-13-012-020 [P1] GAP facet F10
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:54` valid A-only or AAAA-only domain ACCEPTS_MAIL
- Expected fix: Do not reject A-only/AAAA-only mail-receiving domains; test records and resolvers

## G2-13-012-026 [P1] GAP facet F12
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/MailDomainResolver.java:7-12` allows MX or A/AAAA; no response is UNKNOWN not NO_MAIL
- Expected fix: Restore documented semantics while retaining explicit safety decision for OTP mailability

## G2-13-012-034 [P1] GAP facet F15
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:77-102` mail acceptability influences recruiter email acceptance
- Expected fix: Record notification suppression reason with caller, and offer retry only for transient DNS failures

## G2-13-012-045 [P1] GAP facet F20
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:69-77` treats non-timeout record-specific NamingException as absence, continues A/AAAA
- Expected fix: On no MX data, query A and AAAA before declaring NO_MAIL

## G2-13-012-051 [P1] GAP facet F23
- Files: src/modules/placements/public-join/send-code-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:54` permits A or AAAA fallback and `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/DnsMailDomainResolver.java:58-59` UNKNOWN nonblocking
- Expected fix: Track intentional strict-mail policy as a migration decision, not a presumed match

## G2-13-014-001 [P1] GAP facet F01
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:20-37` cache is org-partitioned service supporting searchWithinOrganization/countWithinOrganization and refresh
- Expected fix: Provide organization-scoped application search adapter if legacy global job search is still needed

## G2-13-014-008 [P1] GAP facet F04
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:14-21` id, learnerId, learnerName, jobId, jobTitle, companyName, applicationStatus, organizationId
- Expected fix: Create field-level DTO translation for org-wide search including company name/job title and application status

## G2-13-014-009 [P1] GAP facet F04
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:77-90` orgId taken from application.organizationId else job.organizationId
- Expected fix: Specify organization→college→job mapping and null/fallback semantics for old imported applications

## G2-13-014-011 [P1] GAP facet F04
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts, src/modules/placements/tpo-applicant-pipeline-model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:81-90` app.applicationStatus includes APPLIED,SHORTLISTED,etc from `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:29-30`
- Expected fix: Provide explicit state mapping including legacy OFFERED/HIRED/ASSESSMENT/INTERVIEW statuses from other stage tables

## G2-13-014-015 [P1] GAP facet F05
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:101-121` scoped to all applications in one organization regardless of job
- Expected fix: Add authorized org-wide discovery/report; do not force users to search each job manually

## G2-13-014-016 [P1] GAP facet F05
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:119-121` totalApplications counts all org non-deleted applications
- Expected fix: Implement org-wide count with same deletion and status inclusion semantics

## G2-13-014-026 [P1] GAP facet F10
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:49-71` loads Jpa findAllByIsDeletedFalse; Java maps DTO and partitions by org
- Expected fix: Document missing legacy application inclusion and build org-wide read if intended

## G2-13-014-028 [P1] GAP facet F10
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts, src/db/schema/placements.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobApplicationRepository.java:111-113` eager FETCH learner+job, excludes isDeleted false
- Expected fix: Map old is_deleted and withdrawn semantics to vNext application state and import filters

## G2-13-014-030 [P1] GAP facet F11
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:64-79` scoped superadmin JWT org overrides query; global superadmin may supply organizationId; others derive auth org
- Expected fix: Implement global/scoped superadmin org-search permission explicitly, preserving org-parameter anti-escape logic

## G2-13-014-032 [P1] GAP facet F11
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:78` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:100` requireAccessOrganization(principal,orgId) before read/count
- Expected fix: Preserve organization tenancy for cross-college jobs and reporting while retaining TPO role guard

## G2-13-014-034 [P1] GAP facet F12
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:65-70` groups DTOs by application.orgId / job fallback; null org excluded
- Expected fix: Specify whether null-org legacy data is excluded and how vNext migrated users map to organizations

## G2-13-014-035 [P1] GAP facet F12
- Files: src/modules/placements/tpo-applicant-pipeline-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:101-116` filter string from learnerName jobTitle companyName applicationStatus
- Expected fix: Add company and status term search in correct role-scoped report, preserve newly added roster fields

## G2-17-23-047 [P1] GAP facet F10 Side effects application
- Files: (none, new feature)
- Legacy: JS:1195–1256 OFFERED→HIRED on accept, OFFERED→REJECTED on decline; fixed rejection reason, clears letter on decline, cancels interviews
- Expected fix: Document application-vs-offer state ownership; ensure all reports and learner timeline reflect accepted/declined decision without legacy HIRED/REJECTED column

## G2-17-028-024 [P1] GAP facet F10 Read API
- Files: (none, new feature)
- Legacy: LH:28-55 calls LA:388 GET `/api/v1/admin/projects/{id}?collegeId=`, gets embedded readiness and resolvedTasks
- Expected fix: Use one scoped workspace view/readiness shape or BFF with embedded proof tasks; avoid an extra unsynchronized fetch for coverage

## G2-18-019-031 [P1] GAP facet F12 Bypass codes
- Files: (none, new feature)
- Legacy: LS:50-83 special, global and tenant fixed codes restricted to nonprod `TestOtpService`
- Expected fix: Do not port any special-phone/global code; preserve isolated dev-only QA identities, disallow prod test OTP

## G2-18-030-039 [P1] GAP facet F11 SA privilege
- Files: (none, new feature)
- Legacy: L:26-29 supports unscoped global Super Admin directory; mutation payload carries college_id
- Expected fix: Test selected-college SA acting scope authorization, no privilege via forged college ID, explicit missing-scope error

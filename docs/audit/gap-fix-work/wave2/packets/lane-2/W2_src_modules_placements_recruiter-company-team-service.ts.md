# Work packet (wave 2): edit src/modules/placements/recruiter-company-team-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-003  [P2] GAP  facet F01  effort M
- Legacy: Recruiter account is college-bound; absent college shows address-specific guidance (`docs/legacy-source/frontend/src/components/recruiter/useRecruiterCollege.js:4-21`)
- vNext now: Multi-grant account displays an in-app college selector instead (`src/modules/placements/recruiter-company-team-service.ts:25-44`)
- Fix: Document intentional multi-grant change; show legacy placement-address guidance when tenant host is required.

## G2-13-001-015  [P2] MISSING  facet F04  effort M
- Legacy: Logo source is company.logoUrl; first char used for missing URL (`docs/legacy-source/frontend/src/pages/recruiter/company.js:59-59`)
- vNext now: logoObjectPath fetched but never rendered (`src/modules/placements/recruiter-company-team-service.ts:56-64`)
- Fix: Resolve signed image URL and render fallback avatar in page.

## G2-13-001-026  [P2] GAP  facet F05  effort S
- Legacy: Team list default order `You` first, then firstName (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:83-94`)
- vNext now: Team list defaults alphabetical displayName then email, not `You` first (`src/modules/placements/recruiter-company-team-service.ts:111-135`)
- Fix: Order current recruiter first, then first name/displayName deterministically.

## G2-13-001-049  [P2] GAP  facet F11  effort M
- Legacy: Company view is access-controlled by college grant but profile selected by recruiter.companyId (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:94-100`)
- vNext now: Company requires companyRelationshipId matching active company and granted college (`src/modules/placements/recruiter-company-team-service.ts:100-109`)
- Fix: Verify all intended multi-college company relationship memberships work; fail closed on mismatches.

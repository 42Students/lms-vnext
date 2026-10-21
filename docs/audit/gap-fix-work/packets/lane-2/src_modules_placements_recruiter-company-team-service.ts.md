# Work packet: edit src/modules/placements/recruiter-company-team-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/recruiter-company.md

## G2-13-001-041  [P1] GAP  facet F10  effort S
- Legacy: Company GET `/api/v1/recruiter/colleges/{collegeId}/company` (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:79-80`)
- vNext now: Server reads placementCompanies/Relationships directly, no matching client GET (`src/modules/placements/recruiter-company-team-service.ts:55-107`)
- Fix: Keep centralized authorization and document transport shift; ensure same company payload fields.

## G2-13-001-042  [P1] GAP  facet F10  effort M
- Legacy: Team GET `/api/v1/recruiter/colleges/{collegeId}/team` (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:81-82`)
- vNext now: Server performs DB team query and GET export only (`src/modules/placements/recruiter-company-team-service.ts:111-145`)
- Fix: Compare team query projection, sort, count and authorization for parity.

## G2-13-001-046  [P1] GAP  facet F11  effort M
- Legacy: Old controller requires college grant, even for company/team, using requireCollege (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:94-108`)
- vNext now: New resolveGrant requires recruiter role, exact grant, active verified nonexpired relationship (`src/modules/placements/recruiter-company-team-service.ts:28-44`)
- Fix: Document stricter verified/expiry policy as an explicit authorized behavioral change.

## G2-13-001-077  [P1] GAP  facet F20  effort M
- Legacy: Old team `valid_until` nullable; NULL means no expiry (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:89-91`)
- vNext now: New verified grant requires `validUntil > clock_timestamp()` (`src/modules/placements/recruiter-company-team-service.ts:86-95`)
- Fix: Decide migration rule for indefinite grants; no legitimate grant should disappear unexpectedly.

## G2-13-001-082  [P1] GAP  facet F22  effort L
- Legacy: Legacy profile comes from company, company_domain, recruiter foreign key (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:73-80`)
- vNext now: New from placement_companies, relationships, recruiter profiles/grants (`src/modules/placements/recruiter-company-team-service.ts:55-106`)
- Fix: Document field migration: name, website, industry, logo, verified, multi-domain; map missing fields or declare intentional dropped fields.

## G2-13-001-083  [P1] GAP  facet F22  effort M
- Legacy: Legacy roster uses recruiter_college_access active/expiry and nondeleted recruiter (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:83-94`)
- vNext now: New roster joins verified grant, profile and users platformStatus (`src/modules/placements/recruiter-company-team-service.ts:111-135`)
- Fix: Confirm nullable expiry, suspension/deletion migration and unique grant cardinality before claiming parity.

## G2-13-001-034  [P2] GAP  facet F07  effort M
- Legacy: Missing/null response shows `This information was unavailable in the response. Please retry.` (`docs/legacy-source/frontend/src/pages/recruiter/company.js:37-45`)
- vNext now: Missing verified relationship raises AuthorizationError rather than incomplete-data Retry alert (`src/modules/placements/recruiter-company-team-service.ts:109-109`)
- Fix: Separate corrupted/incomplete response from revoked authorization and give Retry vs access-ended appropriately.

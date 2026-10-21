# Work packet: edit src/modules/placements/tpo-company-memory-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-companies.md, docs/audit/gap2/lane-14/u020-college-company.md

## G2-11-007-026  [P1] GAP  facet F04  effort M
- Legacy: Legacy `getDriveCounts` keyed jobId supplies Applied and Offers; a failure yields unavailable, not zero. `docs/legacy-source/frontend/src/pages/tpo/companies.js:49`
- vNext now: vNext `getCompanyDriveCounts` projects `applied/ offers` and defaults missing map entry to zero. `src/modules/placements/tpo-company-memory-service.ts:423`
- Fix: Propagate unknown count provenance and display Unavailable instead of inferred zero.

## G2-11-007-043  [P1] GAP  facet F07  effort M
- Legacy: Legacy counts failure text `Could not load drive application counts.`; warning `Drive application counts are unavailable`, action `Retry counts`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:64`
- vNext now: vNext name view silently maps missing per-job counts to 0 and lacks same warning. `src/modules/placements/tpo-company-memory-service.ts:428`
- Fix: Preserve counts error signal and warning+Retry counts CTA.

## G2-11-007-102  [P1] GAP  facet F22  effort L
- Legacy: Legacy company identity based on recruiter_lead.company_name and job.company_name, optional college_company/companyId; query aliases by normalized strings. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:385`
- vNext now: vNext joins placementCompanies and placementCompanyRelationships + CRM lead company relationships; UUIDs required canonical detail. `src/modules/placements/tpo-company-memory-service.ts:139`
- Fix: Write legacy-to-Postgres company identity/alias data crosswalk incl. orphan rows.

## G2-11-007-103  [P1] GAP  facet F22  effort L
- Legacy: Legacy company hiring from job + application and placement rules; year recorded per drive. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:411`
- vNext now: vNext uses placementJobs, placementOffers, placementJoiningOutcomes and configured rules. `src/modules/placements/tpo-company-memory-service.ts:188`
- Fix: Compare placed definitions, indexes, year type and distinct applicant keys.

## G2-14-020-010  [P1] GAP  facet F04  effort M
- Legacy: Legacy internalNotes TEXT unbounded `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/CollegeCompany.java:35-36`
- vNext now: No internalNotes in new relationship row; TPO memory uses leads/activity `src/modules/placements/tpo-company-memory-service.ts:390-435`
- Fix: Migrate old private notes to dedicated college-scoped memory record

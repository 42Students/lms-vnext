# Work packet: edit src/modules/placements/validation.ts (part 3 of 3)

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/admin-job-service.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md, docs/audit/gap2/lane-9/superadmin-companies-college.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-15/job-eligibility-override.md, docs/audit/gap2/lane-2/admin-job-controller.md

## G2-8-012-013  [P1] GAP  facet F06  effort L
- Legacy: Create validates visibilityType INTERNAL_ONLY/HYBRID/EXTERNAL_ONLY (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:479-489`)
- vNext now: VNext createPlacementJobInputSchema and applicationMode/url policy (`src/modules/placements/validation.ts:260-388`)
- Fix: Map old visibility modes to vNext job applicationMode/public link semantics

## G2-8-012-014  [P1] GAP  facet F06  effort M
- Legacy: EXTERNAL_ONLY rejects all targeting fields (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:512-526`)
- vNext now: VNext eligibility and visibility separated into tenant eligibility policy (`src/modules/placements/validation.ts:557-630`)
- Fix: Explicitly enforce no hidden LMS targeting for external-only public applications if retained

## G2-8-012-017  [P1] GAP  facet F06  effort L
- Legacy: Target hierarchy validates class→batch/program→department and college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2018-2137`)
- vNext now: VNext validation and roster-scoped eligibility policies (`src/modules/placements/validation.ts:557-630; src/modules/placements/job-service.ts:150-205`)
- Fix: Verify exact hierarchy/archival/tenant validation against courses/groups schema

## G2-15-026-017  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:119-125 isActive default true, isDraft default false
- vNext now: src/modules/placements/validation.ts:260-268 new lifecycle statuses, src/modules/placements/job-service.ts:150-271 season-scoped create
- Fix: Map default draft/published state to legacy flags; don't silently publish new jobs

## G2-9-033-077  [P1] GAP  facet F07  effort M
- Legacy: Missing website/email identity error 'Add the company’s website or a company email...' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:138-147`
- vNext now: Both websiteUrl and primaryDomain optional `src/modules/placements/validation.ts:32-40`
- Fix: Validate that a canonical domain or company email identifies every company.

## G2-9-033-079  [P1] GAP  facet F07  effort S
- Legacy: Website/logo must be https with URL error labels `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:484-489`
- vNext now: Validator allows http and https `src/modules/placements/validation.ts:6-13`
- Fix: Reject HTTP for company public website/logo fields and preserve wording.

## G2-14-011-028  [P2] GAP  facet F07  effort S
- Legacy: Assessment deadline in past gets distinct error `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:285-295`
- vNext now: New create validates relation but no matching specific past error `src/modules/placements/validation.ts:313-319`
- Fix: Add past-date validation with matching text

## G2-14-011-030  [P2] GAP  facet F07  effort S
- Legacy: Invalid visibility specifies all three options `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:315-323`
- vNext now: New Zod applicationMode rejects wrong string `src/modules/placements/validation.ts:269-273` `src/modules/placements/validation.ts:307-308`
- Fix: Add legacy alias-specific error explanation

## G2-15-015-022  [P2] GAP  facet F07  effort S
- Legacy: Error Choose include or exclude; A reason is required. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveExtrasService.java:385-386`)
- vNext now: New Zod validation messages differ, min1. (`src/modules/placements/validation.ts:630-637`)
- Fix: Match exact old field errors and >=3 rule.

## G2-2-016-090  [P2] GAP  facet F07  effort S
- Legacy: Invalid or missing collegeId: `collegeId must be a positive integer` 400 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:113-116`
- vNext now: New requires UUID collegeId via schema and scoped roles; different validation message `src/modules/placements/validation.ts:285-288`
- Fix: Return a field-specific invalid college context message without leaking cross-tenant data

## G2-13-019-014  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:82-84`
- vNext now: `src/modules/placements/validation.ts:327-334`
- Fix: Legacy 'CTC range must be in format like 6-10 LPA' vs vNext maximum>=minimum constraint error.

## G2-13-020-022  [P2] GAP  facet F07  effort M
- Legacy: Exact error 'Company name must be between 2 and 150 characters' `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:33-35`
- vNext now: Zod generic min2 max200 `src/modules/placements/validation.ts:34-35`
- Fix: Use exact inline validation copy.

## G2-13-020-024  [P2] GAP  facet F07  effort M
- Legacy: HTTPS only errors '[field] must be a valid https link' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:480-490`
- vNext now: New accepts http and error 'Use an http or https URL' `src/modules/placements/validation.ts:6-13`
- Fix: Require HTTPS and correct error placement.

## G2-13-030-016  [P2] GAP  facet F07  effort M
- Legacy: Rating error 'Please rate the candidate' `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:124-133`
- vNext now: New score percent validation default Zod errors `src/modules/placements/validation.ts:1037-1044`
- Fix: Show exact field error text.

## G2-13-030-017  [P2] GAP  facet F07  effort M
- Legacy: Recommendation error 'Please select a recommendation' `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:139-142`
- vNext now: New enum validation rejects unknown outcomes generically `src/modules/placements/validation.ts:1027-1032`
- Fix: Show exact field error text.

## G2-15-026-024  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:679-716 positive application ID/newStatus required or 400
- vNext now: src/modules/placements/validation.ts:651-674 UUID-based application input validation
- Fix: Translate invalid legacy IDs to UUID validation; retain required-status copy

## G2-8-015-023  [P3] GAP  facet F07  effort M
- Legacy: Legacy @JsonIgnoreProperties unknown fields (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobRound.java:18-20`)
- vNext now: VNext Zod strict schemas reject unexpected fields (`src/modules/placements/validation.ts:742-819`)
- Fix: Document strict validation change for old clients

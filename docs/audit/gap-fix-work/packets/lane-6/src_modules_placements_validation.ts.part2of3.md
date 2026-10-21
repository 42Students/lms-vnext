# Work packet: edit src/modules/placements/validation.ts (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-4/l13-u020-company-model.md, docs/audit/gap2/lane-4/l13-u030-interview-feedback-form.md

## G2-2-016-014  [P1] GAP  facet F06  effort M
- Legacy: EXTERNAL_ONLY rejects all targeting fields (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:512-526`)
- vNext now: VNext eligibility and visibility separated into tenant eligibility policy (`src/modules/placements/validation.ts:557-630`)
- Fix: Explicitly enforce no hidden LMS targeting for external-only public applications if retained

## G2-2-016-017  [P1] GAP  facet F06  effort L
- Legacy: Target hierarchy validates class→batch/program→department and college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:2018-2137`)
- vNext now: VNext validation and roster-scoped eligibility policies (`src/modules/placements/validation.ts:557-630; src/modules/placements/job-service.ts:150-205`)
- Fix: Verify exact hierarchy/archival/tenant validation against courses/groups schema

## G2-2-016-159  [P1] GAP  facet F22  effort L
- Legacy: Legacy visibility_type, job_slug and assessment_url persisted `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:225-246`
- vNext now: New applicationMode and externalApplicationUrl, not same slug field in job schema mapping `src/modules/placements/validation.ts:269-310`
- Fix: Map public slug and external-only visibility to safe URLs while retaining old deep-links

## G2-13-020-006  [P1] GAP  facet F04  effort M
- Legacy: Company name 2..150 with exact validation message `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:33-36`
- vNext now: New name trimmed 2..200 in Zod `src/modules/placements/validation.ts:32-37`
- Fix: Cap at 150 and present legacy validation phrase.

## G2-13-020-008  [P1] GAP  facet F04  effort M
- Legacy: Legacy website max500 HTTPS `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:42-44`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:480-490`
- vNext now: New accepts HTTP or HTTPS website via Zod `src/modules/placements/validation.ts:6-13`
- Fix: Require https only, max500, correct error string.

## G2-13-020-011  [P1] MISSING  facet F04  effort M
- Legacy: Contact person max150, email max150, phone max30 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:54-64`
- vNext now: New core create request lacks contact fields `src/modules/placements/validation.ts:32-41`
- Fix: Add private college relationship contact storage/endpoints.

## G2-13-020-019  [P1] GAP  facet F06  effort M
- Legacy: Create requires at least website or company email identifying domain `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:137-149`
- vNext now: New create schema websiteUrl and primaryDomain both optional `src/modules/placements/validation.ts:32-41`
- Fix: Require at least one validated corporate identity source.

## G2-13-020-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy permits private contact+notes in create/update `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:54-68`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:325-340`
- vNext now: New create only name/site/domain/isTrusted `src/modules/placements/validation.ts:32-41`
- Fix: Add private contact/notes controls without leaking to global company.

## G2-13-020-021  [P1] GAP  facet F06  effort M
- Legacy: Legacy update is partial (nullable fields ignored/empty sanitization) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:248-292`
- vNext now: New update only isTrusted/ownerMembershipId `src/modules/placements/validation.ts:42-53`
- Fix: Implement scoped shared metadata editing and private detail partial update.

## G2-13-020-023  [P1] GAP  facet F07  effort M
- Legacy: Missing domain says 'Add the company’s website or a company email...' `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:143-146`
- vNext now: New optional domain/site permit undomain identity `src/modules/placements/validation.ts:32-41`
- Fix: Reject missing verified company identity and preserve helper copy.

## G2-13-030-006  [P1] GAP  facet F03  effort M
- Legacy: Recommendation Select placeholder 'Select outcome' with 4 options `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:138-150`
- vNext now: New outcomes PASS/FAIL/HOLD/ABSENT `src/modules/placements/validation.ts:1011-1018`
- Fix: Map PROCEED/HIRE/REJECT/HOLD to new result/offer state without conflation.

## G2-13-030-012  [P1] GAP  facet F06  effort M
- Legacy: rating required, count5, must >0 `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:124-136`
- vNext now: New scorePercent optional 0..100 `src/modules/placements/validation.ts:1037-1044`
- Fix: Require 1-5 rating for feedback path, avoid using 0% as unrated.

## G2-13-030-013  [P1] GAP  facet F06  effort M
- Legacy: recommendAction required `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:138-149`
- vNext now: New outcome required PASS/FAIL/HOLD/ABSENT `src/modules/placements/validation.ts:1027-1032`
- Fix: Restore four allowed recommendations with explicit transition mapping.

## G2-13-030-014  [P1] GAP  facet F06  effort M
- Legacy: REJECT makes comments required and max500; else max2000 `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:152-177`
- vNext now: New candidateMessage max1000 and internalComment max2000, non-PASS requires candidate message `src/modules/placements/validation.ts:1045-1089`
- Fix: Use max500 reject rationale rule or deliberate safer split with exact warning.

## G2-13-030-018  [P1] GAP  facet F07  effort M
- Legacy: REJECT comments error 'Add feedback explaining the rejection — this will be shared with the candidate.' `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:159-168`
- vNext now: New candidateMessage/internalComment separate and privacy-aware `src/modules/placements/validation.ts:1045-1064`
- Fix: Correct unsafe legacy helper text to reflect generic candidate rejection reason if policy remains.

## G2-13-030-020  [P1] GAP  facet F07  effort M
- Legacy: Server enforces rating 1..5, allowed four actions `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1544-1555`
- vNext now: New percent 0..100 and outcome enum `src/modules/placements/validation.ts:1011-1044`
- Fix: Introduce lossless star score/action validators for feedback path.

## G2-13-030-027  [P1] GAP  facet F10  effort M
- Legacy: HOLD and PROCEED don't auto-advance application status `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1274-1283`
- vNext now: New HOLD requires waitlistRank, PASS advances next round `src/modules/placements/validation.ts:1069-1089`; `src/modules/placements/result-service.ts:747-760`
- Fix: Do not silently translate legacy HOLD into ranked waitlist without consent.

## G2-13-030-037  [P1] GAP  facet F15  effort M
- Legacy: Legacy auto-reject sends generic candidate-facing 'Not selected after interview', internal raw comments `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1346-1363`
- vNext now: New candidateMessage vs internalComment separation `src/modules/placements/validation.ts:1045-1063`
- Fix: Ensure generic/sanitized candidate rejection and never send private notes; correct legacy UI promise.

## G2-13-030-046  [P1] GAP  facet F22  effort M
- Legacy: Legacy V48 converts boolean true→PROCEED, false→REJECT `docs/legacy-source/backend/src/main/resources/db/migration/V48__interview_feedback_action_and_drop_hour_index.sql:69-78`
- vNext now: New staged result expects PASS/FAIL/HOLD/ABSENT `src/modules/placements/validation.ts:1011-1018`
- Fix: Document boolean historical mapping and prevent misreading recommend-as-final-outcome.

## G2-13-030-047  [P1] MISSING  facet F23  effort M
- Legacy: Legacy status actions include HIRE distinct from next-round `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:144-149`
- vNext now: New PASS/FAIL/HOLD/ABSENT doesn't include HIRE `src/modules/placements/validation.ts:1011-1018`
- Fix: Introduce precise hire recommendation with no automatic offer release.

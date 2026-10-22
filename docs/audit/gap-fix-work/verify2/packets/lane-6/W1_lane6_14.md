# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-005-006 [P1] GAP facet F03
- Files: src/app/(authenticated)/college/faculty-assignment/page.tsx
- Legacy: Edit and Delete icons/actions each row. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379`)
- Expected fix: Implement complete edit and restore/delete policy.

## G2-13-020-006 [P1] GAP facet F04
- Files: src/modules/placements/validation.ts
- Legacy: Company name 2..150 with exact validation message `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:33-36`
- Expected fix: Cap at 150 and present legacy validation phrase.

## G2-13-020-008 [P1] GAP facet F04
- Files: src/modules/placements/validation.ts
- Legacy: Legacy website max500 HTTPS `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:42-44`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:480-490`
- Expected fix: Require https only, max500, correct error string.

## G2-13-020-011 [P1] MISSING facet F04
- Files: src/modules/placements/validation.ts
- Legacy: Contact person max150, email max150, phone max30 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:54-64`
- Expected fix: Add private college relationship contact storage/endpoints.

## G2-13-020-019 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: Create requires at least website or company email identifying domain `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:137-149`
- Expected fix: Require at least one validated corporate identity source.

## G2-13-020-020 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: Legacy permits private contact+notes in create/update `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Company.java:54-68`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:325-340`
- Expected fix: Add private contact/notes controls without leaking to global company.

## G2-13-020-021 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: Legacy update is partial (nullable fields ignored/empty sanitization) `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:248-292`
- Expected fix: Implement scoped shared metadata editing and private detail partial update.

## G2-13-020-027 [P1] GAP facet F10
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy create reuses existing company if owned domain matches, verified name wins `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:137-180`
- Expected fix: Use domain as authoritative identity; avoid collapsing different same-name companies.

## G2-13-020-028 [P1] MISSING facet F10
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy update shared fields when 42 SA or origin college, syncs job name/logo `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:248-310`
- Expected fix: Rebuild global-edit guard and denormalized job resync.

## G2-13-020-029 [P1] GAP facet F10
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy create/update/delete/restore emits audit action records `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:46-59`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:191-193`
- Expected fix: Emit create/update/delete/restore comparable audited actions.

## G2-13-020-032 [P1] GAP facet F11
- Files: src/modules/placements/company-service.ts
- Legacy: Verified companies only editable globally; origin college owns unverified shared details `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:250-258`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:314-323`
- Expected fix: Enforce separate platform verified vs origin-college shared edit rules.

## G2-13-020-044 [P1] GAP facet F20
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy domain concurrent ownership save catches collision `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:226-240`
- Expected fix: Re-query by domain, never reuse unrelated name match under races.

## G2-13-020-045 [P1] MISSING facet F20
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy shared rename lock and linked job resync serialized `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/CompanyServiceImpl.java:248-310`
- Expected fix: Implement transactional global rename with linked-job updates.

## G2-13-030-006 [P1] GAP facet F03
- Files: src/modules/placements/validation.ts
- Legacy: Recommendation Select placeholder 'Select outcome' with 4 options `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:138-150`
- Expected fix: Map PROCEED/HIRE/REJECT/HOLD to new result/offer state without conflation.

## G2-13-030-012 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: rating required, count5, must >0 `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:124-136`
- Expected fix: Require 1-5 rating for feedback path, avoid using 0% as unrated.

## G2-13-030-014 [P1] GAP facet F06
- Files: src/modules/placements/validation.ts
- Legacy: REJECT makes comments required and max500; else max2000 `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:152-177`
- Expected fix: Use max500 reject rationale rule or deliberate safer split with exact warning.

## G2-13-030-018 [P1] GAP facet F07
- Files: src/modules/placements/validation.ts
- Legacy: REJECT comments error 'Add feedback explaining the rejection — this will be shared with the candidate.' `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:159-168`
- Expected fix: Correct unsafe legacy helper text to reflect generic candidate rejection reason if policy remains.

## G2-13-030-020 [P1] GAP facet F07
- Files: src/modules/placements/validation.ts
- Legacy: Server enforces rating 1..5, allowed four actions `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1544-1555`
- Expected fix: Introduce lossless star score/action validators for feedback path.

## G2-13-030-027 [P1] GAP facet F10
- Files: src/modules/placements/validation.ts, src/modules/placements/result-service.ts
- Legacy: HOLD and PROCEED don't auto-advance application status `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1274-1283`
- Expected fix: Do not silently translate legacy HOLD into ranked waitlist without consent.

## G2-13-030-037 [P1] GAP facet F15
- Files: src/modules/placements/validation.ts
- Legacy: Legacy auto-reject sends generic candidate-facing 'Not selected after interview', internal raw comments `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:1346-1363`
- Expected fix: Ensure generic/sanitized candidate rejection and never send private notes; correct legacy UI promise.

## G2-13-030-046 [P1] GAP facet F22
- Files: src/modules/placements/validation.ts
- Legacy: Legacy V48 converts boolean true→PROCEED, false→REJECT `docs/legacy-source/backend/src/main/resources/db/migration/V48__interview_feedback_action_and_drop_hour_index.sql:69-78`
- Expected fix: Document boolean historical mapping and prevent misreading recommend-as-final-outcome.

## G2-13-030-047 [P1] MISSING facet F23
- Files: src/modules/placements/validation.ts
- Legacy: Legacy status actions include HIRE distinct from next-round `docs/legacy-source/frontend/src/pages/superadmin/sections/InterviewFeedbackForm.js:144-149`
- Expected fix: Introduce precise hire recommendation with no automatic offer release.

## G2-4-013-077 [P1] GAP facet F18
- Files: src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx
- Legacy: Legacy roster warning Report is partially loaded and Retry roster. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:167-175`)
- Expected fix: Restore precise warning and retry copy.

## G2-4-023-007 [P1] MISSING facet F03
- Files: src/app/api/placements/tpo/companies/create/route.ts
- Legacy: Resolve returns id, name, logoUrl, verifiedBy42, existed, nameLocked (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:59-67`)
- Expected fix: Provide existed/nameLocked/verified/logo to show exactly why the canonical company was reused.

## G2-4-023-012 [P1] GAP facet F04
- Files: src/modules/placements/company-service.ts
- Legacy: Legacy search is worldwide/global directory plus relationships filtered by selected college (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:22-24,47-50`)
- Expected fix: Add separate canonical lookup and curated-first results without cross-college contact leakage.

## Lane chat-20 verification (2026-10-22)
- FIXED G2-13-020-006: company name now accepts 2..150 with matching validation message.
- FIXED G2-13-030-014, G2-13-030-018: feedback cap 2000, rejected feedback cap 500, candidate copy no longer promises to share private notes.
- OK G2-13-020-008, G2-13-020-011, G2-13-020-019, G2-13-020-020, G2-13-020-027, G2-13-020-029, G2-13-020-044: HTTPS 500-character website schema, private contact fields, corporate identity prerequisite, scoped relationship storage, locked canonical domain resolution, audited relationship writes and domain race serialization were confirmed by direct source inspection.
- OK G2-13-030-012, G2-13-030-020, G2-13-030-027, G2-13-030-047: explicit 1..5 rating and action enum including HIRE; HOLD transition keeps current stage.
- OK G2-4-023-007: create response returns canonical company metadata, existed, nameLocked, verifiedBy42, logoUrl.
- DEFERRED G2-4-005-006: faculty assignment edit/delete and restore policy absent from page; requires service and permission design.
- DEFERRED G2-13-020-021, G2-13-020-028, G2-13-020-032, G2-13-020-045: shared global metadata edit/rename permission and linked job resync need an authorization/transaction review beyond this quick packet.
- DEFERRED G2-13-030-006, G2-13-030-037, G2-13-030-046: full status mapping, candidate-facing rejection delivery, and historical boolean migration need integration tracing.
- DEFERRED G2-4-013-077: error boundary describes partial roster failure but exact in-page Retry roster state needs report component tracing.
- DEFERRED G2-4-023-012: curated-first cross-college directory search requires query result and privacy boundary review.

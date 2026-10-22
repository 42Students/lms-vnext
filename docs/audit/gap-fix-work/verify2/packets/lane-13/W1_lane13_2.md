# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-011-018 [P1] GAP facet F07
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/profile-validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:925-938`: missing preferences returns mostly null with notification true.
- Expected fix: Honor true opt-out default for existing/new learners.

## G2-1-011-037 [P1] GAP facet F20
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/profile-validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:955-971`: null means no change, empty string writes blank after trim.
- Expected fix: Test nullable legacy patch fields and empty-vs-missing round trip.

## G2-1-011-038 [P1] MISSING facet F20
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/profile-validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:44-45`: Boolean default true even if absent in stored legacy row.
- Expected fix: Prevent notification opt-out silently resetting when migrating profile.

## G2-1-011-040 [P1] GAP facet F22
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/profile-validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:12-45`: job_preferences relational table unique learner_id; six DTO fields plus papInterest in entity.
- Expected fix: Migrate all retained fields; explicitly decide papInterest ownership vs deliberate retirement.

## G2-1-011-044 [P1] GAP facet F23
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/profile-validation.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:14-15`: exam slot and notification opt-out present in old DTO.
- Expected fix: Close two omitted fields and provider behavior before parity sign-off.

## G2-11-031-014 [P1] GAP facet F06
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/profile-validation.ts
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:70-85: primary required exactly 10 numeric digits, alternate 10-15.
- Expected fix: Implement field-specific mobile/alternate validator.

## G2-11-031-015 [P1] GAP facet F06
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/profile-validation.ts
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:171-190: alternate phone cannot equal primary mobile.
- Expected fix: Validate against verified primary on server and client.

## G2-11-031-034 [P1] GAP facet F12
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/profile-validation.ts
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:59-85: 10-digit phone and 10-15 alternate.
- Expected fix: Enforce role/field-specific phone limit.

## G2-11-031-051 [P1] GAP facet F20
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/profile-validation.ts
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:176-188: alternate cannot equal primary.
- Expected fix: Validate cross-field equality.

## G2-19-031-122 [P1] GAP facet F20
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/app/(authenticated)/tpo/announcements/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:198-209` — Undo measured within 30sec of sent_at.
- Expected fix: Anchor undo window to actual sent timestamp.

## G2-1-009-008 [P1] MISSING facet F04
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/learner-academic-summary-service.ts, src/app/(authenticated)/learn/profile/academic-record/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:29-30`: cgpa BigDecimal mapped.
- Expected fix: Project confirmed CGPA from scoped academic evidence, show precision and fallback.

## G2-1-009-012 [P1] MISSING facet F04
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/app/(authenticated)/learn/profile/academic-record/page.tsx, src/modules/people/learner-academic-summary-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:43-44`: ugPct BigDecimal.
- Expected fix: Map UG percentage evidence and represent unavailable field truthfully.

## G2-1-009-035 [P1] MISSING facet F12
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/learner-academic-summary-service.ts, src/app/(authenticated)/learn/profile/academic-record/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:13-16`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/LearnerAcademicRecord.java:72-74`: VERIFIED always wins over SELF eligibility score.
- Expected fix: Resolve VERIFIED-versus-SELF precedence in academic record against published evidence.

## G2-1-004-002 [P1] GAP facet F01
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/components/profile/learner-profile-workspace.tsx
- Legacy: `LearnerProfileController.java:601-666` has education config, exam configs/code, grading types, searchable colleges endpoints.
- Expected fix: Provide canonical configuration and searchable colleges/exams on a supported route.

## G2-1-004-012 [P1] GAP facet F04
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/learner-profile-document-edit-service.ts, src/app/(authenticated)/learn/profile/page.tsx
- Legacy: `LearnerProfileController.java:129-155` owner gets identity full, admins masked, teachers denied; `IdentityDTO.java:10-13` stores Aadhaar/PAN and refs.
- Expected fix: Provide private owner document capture/read and authorized masked admin review, never raw ID in generic JSON.

## G2-1-004-026 [P1] GAP facet F06
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/learner-profile-document-edit-service.ts
- Legacy: `LearnerProfileController.java:220-240` validates Aadhaar/PAN formats at boundary.
- Expected fix: Apply equivalent format validation in secured identity-proof workflow.

## G2-1-004-047 [P1] GAP facet F14
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/people/learner-profile-document-edit-service.ts, src/app/(authenticated)/learn/profile/page.tsx
- Legacy: `LearnerProfileController.java:242-281` tenant-owned ID/image/video/resume storage keys or URLs; no binary body.
- Expected fix: Supply signed receipt upload/view and private admin review with tenant binding.

## G2-1-004-064 [P1] GAP facet F23
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/components/profile/learner-profile-workspace.tsx
- Legacy: `LearnerProfileController.java:601-666` grading, exam and college configuration endpoints.
- Expected fix: Use catalogs/metadata service instead of local-only list.

## G2-1-004-065 [P1] GAP facet F23
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/components/profile/learner-profile-workspace.tsx
- Legacy: `LearnerProfileController.java:1110-1146,1210-1237` video intro and default resume options.
- Expected fix: Decide explicit product parity for video and resume, keep file access signed.

## G2-1-031-045 [P1] GAP facet F14
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/components/profile/learner-profile-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:1410-1486: Resume view/replace/remove .pdf/.doc/.docx and Drive URL import.
- Expected fix: Ensure signed file upload, replace, remove and import from link reachable on profile.

## G2-1-017-004 [P1] GAP facet F03
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/log-alerts/admin-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertAdminService.java:129: distinctAccountCount is nullable numeric field in admin DTO.
- Expected fix: Show unknown/unavailable instead of misleading zero when no trusted account evidence.

## G2-1-017-008 [P1] GAP facet F04
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/log-alerts/admin-service.ts
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V158__log_alert_signature_accounts.sql:5-9: when no account marker exists return null for distinctAccountCount, not 0.
- Expected fix: Persist known-vs-unavailable indicator, return null when no verified account identity was observed.

## G2-1-017-028 [P1] GAP facet F13
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/log-alerts/admin-service.ts
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V158__log_alert_signature_accounts.sql:5-9: no account evidence => API nullable count.
- Expected fix: Return null/unknown and show 'Not available' for unobserved accounts.

## G2-1-017-047 [P1] GAP facet F23
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/modules/log-alerts/admin-service.ts, src/modules/log-alerts/reporter.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertAdminService.java:129: UNKNOWN count represented as nullable distinctAccountCount.
- Expected fix: Restore unknown/null semantic before declaring parity.

## G2-1-032-004 [P1] GAP facet F01
- Verification: DEFERRED — Requires boundary, caller, or end-to-end verification beyond this file-level check.
- Files: src/components/auth/login-form.tsx
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:580-644: multiple matching accounts get chooser with grouped colleges and role.
- Expected fix: Provide role/college chooser with last-used badges or formal new identity-flow UX.

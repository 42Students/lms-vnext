# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-023-031 [P1] GAP facet F12
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Legacy full apply gate order drive published, participation, registration, batch finished, eligibility, held offers; ApplyGate.java:45-88
- Expected fix: Produce ordered denial code table for all eight legacy codes and newer debarment exception, test same as apply POST.

## G2-18-023-039 [P1] GAP facet F18
- Files: src/modules/placements/learner-job-apply-blockers-model.ts
- Legacy: Codes OPEN,DRIVE_CLOSED,NOT_IN_PLACEMENTS,REGISTER_FIRST,REGISTRATION_NOT_OPEN,CHOSE_OTHER,BATCH_FINISHED,RULES,HELD_OFFER; ApplyGate.java:27-88
- Expected fix: Map every legacy denial code and exact actionable message, don't collapse several blockers to generic status.

## G2-18-023-041 [P1] GAP facet F19
- Files: src/modules/placements/learner-job-service.ts
- Legacy: Batch apply-check max 100, dedup input and skip unseen; LearnerEligibilityController.java:79-100
- Expected fix: Implement bounded batch gate to avoid N+1 eligibility/marks and large list latency.

## G2-11-003-095 [P1] GAP facet F20
- Files: src/app/(authenticated)/hr/drives/page.tsx
- Legacy: Failing fetch preserves previous successful drives (stale warning) `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:68`
- Expected fix: Add stale cache/retry in client boundary

## G2-11-005-051 [P1] GAP facet F07
- Files: src/components/tpo/tpo-notice-audience-picker.tsx
- Legacy: Batch empty Pick at least one batch `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:108`
- Expected fix: Attach selection-required message

## G2-11-005-052 [P1] GAP facet F07
- Files: src/components/tpo/tpo-notice-audience-picker.tsx
- Legacy: Branch empty Pick at least one branch `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:114`
- Expected fix: Field-specific branch rule

## G2-11-005-130 [P1] GAP facet F22
- Files: src/app/api/placements/tpo/announcements/route.ts
- Legacy: Legacy tpo announcements and unread-by persisted on SQL backend `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:208`
- Expected fix: Map historical recipients, read receipts and schedule statuses

## G2-11-005-131 [P1] GAP facet F22
- Files: src/app/api/placements/tpo/announcements/route.ts
- Legacy: Legacy DTO `body`,`linkLabel`,`linkUrl`,`pinned`,`audience`,`when` `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:75`
- Expected fix: Document lossless field/status migration

## G2-11-006-021 [P1] GAP facet F05
- Files: src/app/(authenticated)/tpo/audit/page.tsx
- Legacy: Filter side panel with checklist About, What happened, Who, When and dynamic option counts. `docs/legacy-source/frontend/src/pages/tpo/audit.js:23`
- Expected fix: Port all four checklist filters, counts, and chip semantics.

## G2-11-006-055 [P1] GAP facet F14
- Files: src/app/api/placements/tpo/audit/export/route.ts
- Legacy: Range up to 5000 and warns if total > rows loaded; advises narrowing dates. `docs/legacy-source/frontend/src/pages/tpo/audit.js:111`
- Expected fix: Show on-screen truncation warning or stream full bounded export.

## G2-11-006-070 [P1] GAP facet F19
- Files: src/app/api/placements/tpo/audit/export/route.ts
- Legacy: Date-range export can include 5000 rows. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:74`
- Expected fix: Support complete range or explicit truncation workflow.

## G2-11-008-049 [P1] GAP facet F10
- Files: src/app/api/placements/tpo/drive-day/[roundId]/check-in/route.ts
- Legacy: POST `/api/v1/tpo/drive-day/{roundId}/mark` accepts applicationId,status,room. `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:125`
- Expected fix: Add full attendance status/room support via guarded operator route.

## G2-11-012-049 [P1] MISSING facet F08
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Failed refresh with rows retains old drives and shows This refresh failed. Drives below are from last successful load. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:421`
- Expected fix: Cache last-good list and provide stale-banner Retry.

## G2-11-011-006 [P1] GAP facet F02
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Main form has Start from, The drive, Pay packages, Eligibility, Skills, Rounds sections. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:547`
- Expected fix: Port all sections/field groups for edit workspace.

## G2-11-011-017 [P1] MISSING facet F03
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Mode On campus/Pool/Off campus with explanatory help. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:595`
- Expected fix: Recreate mode field and context-specific fields.

## G2-11-011-020 [P1] MISSING facet F03
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Off-campus mode shows company application URL field. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:606`
- Expected fix: Expose off-campus URL with https validation.

## G2-11-011-021 [P1] MISSING facet F03
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Recorded outside checkbox disables normal application window. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:608`
- Expected fix: Expose mode aftercare state with safe notification rule.

## G2-11-011-022 [P1] MISSING facet F03
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Portal-registration checkbox and portal name/url fields. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:611`
- Expected fix: Restore external registration section and preview.

## G2-11-011-026 [P1] GAP facet F03
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Category computed Regular/Dream/Super-dream, optional override with reason. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:647`
- Expected fix: Restore three-tier category and reason override UI.

## G2-11-011-030 [P1] MISSING facet F04
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Branches selector merges choices/students. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:672`
- Expected fix: Expose branch options with all-branches default.

## G2-11-011-032 [P1] MISSING facet F04
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Percentage throughout 0–100, lowest of qualifying school/UG marks. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:680`
- Expected fix: Port eligibility percentage mapping.

## G2-11-011-048 [P1] MISSING facet F06
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Category override requires reason. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:651`
- Expected fix: Require reason for manual tier override.

## G2-11-011-050 [P1] GAP facet F06
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Autosave minimum company and role length3; no early save. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:290`
- Expected fix: Match draft save trigger/minimal fields without losing safety.

## G2-11-011-055 [P1] MISSING facet F07
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Eligibility preview failure hides stale counts; Retry. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:745`
- Expected fix: Implement fail-closed eligibility panel and Retry.

## G2-11-011-062 [P1] MISSING facet F09
- Files: src/components/placements/tpo-drive-edit-form.tsx
- Legacy: Recruiter request live modal warns company owns pay/location and eligibility only tightens. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:482`
- Expected fix: Add recruiter-owned-field/eligibility restriction warning.

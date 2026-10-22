# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-001-050 [P1] GAP facet F12
- Files: src/modules/placements/public-page/read-service.ts
- Legacy: Legacy published as soon as enabled. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:78`
- Expected fix: Decide freshness policy or align.

## G2-11-001-068 [P1] GAP facet F18
- Files: src/components/placements/public-recruit-from-us.tsx
- Legacy: Backend error JSON includes user-facing message. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:76`
- Expected fix: Use safe typed error message.

## G2-11-001-071 [P1] GAP facet F20
- Files: src/components/placements/public-recruit-from-us.tsx
- Legacy: savingRef guards rapid double submission. `docs/legacy-source/frontend/src/pages/placements/index.js:34`
- Expected fix: Add ref/idempotency.

## G2-11-003-015 [P1] GAP facet F03
- Files: src/components/placements/recruiter-placement-portfolio.tsx
- Legacy: Primary Answer only if openRequests >0 `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:219`
- Expected fix: Show Answer only when actionable

## G2-11-003-017 [P1] GAP facet F03
- Files: src/components/placements/recruiter-placement-portfolio.tsx
- Legacy: Hire again only closed/rejected/cancelled `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:220`
- Expected fix: Gate based on completed lifecycle

## G2-11-003-019 [P1] GAP facet F04
- Files: src/components/placements/recruiter-placement-portfolio.tsx
- Legacy: Row status from driveStatus mapping lifecycle `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:208`
- Expected fix: Map waiting/rejected/cancelled status

## G2-11-003-025 [P1] GAP facet F04
- Files: src/components/placements/recruiter-placement-portfolio.tsx
- Legacy: Next helper derived driveNextAction `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:216`
- Expected fix: Map legacy next-action conditions

## G2-11-003-056 [P1] GAP facet F10
- Files: src/components/placements/recruiter-placement-portfolio.tsx
- Legacy: Legacy toReview count all APPLIED without recruiter current results `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:64`
- Expected fix: Recreate toReview count for priority

## G2-11-003-062 [P1] GAP facet F12
- Files: src/components/placements/recruiter-placement-portfolio.tsx
- Legacy: Open questions are highlighted and sorted to top `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:122`
- Expected fix: Apply prioritization before server pagination

## G2-11-003-064 [P1] GAP facet F12
- Files: src/components/placements/recruiter-placement-portfolio.tsx
- Legacy: Answer action if positive openRequests only `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:219`
- Expected fix: Do not route unanswered rows to empty messages

## G2-11-003-067 [P1] GAP facet F13
- Files: src/app/(authenticated)/hr/drives/page.tsx
- Legacy: No-drive capability error explicit, no list `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:116`
- Expected fix: Expose required DRIVES permission failure

## G2-11-003-076 [P1] GAP facet F15
- Files: src/components/placements/recruiter-placement-portfolio.tsx
- Legacy: Next work hint based driveNextAction `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:216`
- Expected fix: Map next action accurately

## G2-11-003-081 [P1] GAP facet F17
- Files: src/components/placements/recruiter-placement-portfolio.tsx
- Legacy: Drive role title keyboard-focusable actual Link `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:204`
- Expected fix: Make heading Link to details

## G2-11-005-137 [P1] GAP facet F23
- Files: src/app/(authenticated)/tpo/announcements/page.tsx
- Legacy: Legacy live automatic reach preview with dropdown changes `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementComposer.jsx:57`
- Expected fix: Restore live preview with blocked-state explanation

## G2-11-012-024 [P1] GAP facet F04
- Files: src/modules/placements/tpo-drive-lifecycle-list-service.ts
- Legacy: Tab count computed via client rows REQUEST/SENT_BACK etc. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:163`
- Expected fix: Map approved/rejected/sent-back request rows and tab badge parity.

## G2-11-012-041 [P1] MISSING facet F06
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Bulk extend skips drives already later than new date. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:261`
- Expected fix: Preserve later-deadline skip rule with preview.

## G2-11-012-046 [P1] GAP facet F07
- Files: src/modules/placements/tpo-drive-lifecycle-list-service.ts
- Legacy: Counts failure uses Could not load applicant and pipeline counts. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:153`
- Expected fix: Fail-open list with count-dependent filters disabled and warning.

## G2-11-012-064 [P1] GAP facet F12
- Files: src/modules/placements/tpo-drive-lifecycle-list-service.ts
- Legacy: Requests tab includes REQUEST+SENT_BACK jobs. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:26`
- Expected fix: Unify request lifecycle projection and label mapping.

## G2-11-012-098 [P1] GAP facet F22
- Files: src/modules/placements/tpo-drive-lifecycle-list-service.ts
- Legacy: Legacy statuses include SENT_BACK/REQUEST/REJECTED inside Job lifecycle. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:43`
- Expected fix: Provide faithful UI projection for multi-entity status history.

## G2-11-010-036 [P1] MISSING facet F06
- Files: src/components/placements/tpo-drive-lifecycle-controls.tsx
- Legacy: Decline OK disabled when reasonIsValid false. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:488`
- Expected fix: Implement request decline validation and disabled state.

## G2-11-010-048 [P1] MISSING facet F09
- Files: src/components/placements/tpo-drive-lifecycle-controls.tsx
- Legacy: Decline uses AsyncModal title Decline this request, reason picker, disabled invalid. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:487`
- Expected fix: Add request decision dialog with fixed choices.

## G2-11-010-061 [P1] GAP facet F11
- Files: src/components/placements/tpo-drive-lifecycle-controls.tsx
- Legacy: Legacy readOnly false regardless of season; frozen limits specific actions. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:270`
- Expected fix: Avoid season locking legacy editable drive solely because of season.

## G2-11-010-078 [P1] GAP facet F15
- Files: src/components/placements/tpo-drive-lifecycle-controls.tsx
- Legacy: Publish confirms N eligible will be notified App and Email. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:520`
- Expected fix: Do not claim email parity; restore email delivery only if configured or document planned difference.

## G2-11-010-101 [P1] GAP facet F22
- Files: src/components/placements/tpo-drive-lifecycle-controls.tsx
- Legacy: Legacy job lifecycle includes REQUEST,SENT_BACK,DRAFT,PUBLISHED,CLOSED,CANCELLED,REJECTED. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:141`
- Expected fix: Map missing recruiter request statuses explicitly and document migrations.

## G2-11-010-108 [P1] GAP facet F23
- Files: src/components/placements/tpo-drive-lifecycle-controls.tsx
- Legacy: Old publish modal allows app+email with clear no-undo warning. `docs/legacy-source/frontend/src/pages/tpo/drives/[jobId].js:501`
- Expected fix: Preserve blocking/notification clarity; change email only after delivery integration.


## Fast verification observations (chat-4)
- OK (source-inspected): G2-11-001-068, G2-11-001-071 (typed public error and synchronous savingRef); G2-11-003-015, G2-11-003-017, G2-11-003-019, G2-11-003-025, G2-11-003-064, G2-11-003-076, G2-11-003-081 (recruiter action/status/hint/accessible title link).
- DEFERRED (requires deeper server/legacy comparison; **not claimed fixed**): G2-11-001-050, G2-11-003-056, G2-11-003-062, G2-11-003-067, G2-11-005-137, G2-11-012-024, G2-11-012-041, G2-11-012-046, G2-11-012-064, G2-11-012-098, G2-11-010-036, G2-11-010-048, G2-11-010-061, G2-11-010-078, G2-11-010-101, G2-11-010-108. Server pagination/permissions and publish/notification contracts need independent validation.

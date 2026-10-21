# Work packet: edit src/components/placements/public-recruit-from-us.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/placements-index.md, docs/audit/gap2/lane-4/public-placements-page-controller.md

## G2-11-001-025  [P1] GAP  facet F06  effort S
- Legacy: Name required before Send me a code. `docs/legacy-source/frontend/src/pages/placements/index.js:47`
- vNext now: Name only appears after code send. `src/components/placements/public-recruit-from-us.tsx:55`
- Fix: Show/validate name before sending.

## G2-11-001-026  [P1] GAP  facet F06  effort S
- Legacy: Company optional, autocomplete organization. `docs/legacy-source/frontend/src/pages/placements/index.js:95`
- vNext now: Company required after code, no organization autocomplete. `src/components/placements/public-recruit-from-us.tsx:61`
- Fix: Make company optional, autocomplete organization.

## G2-11-001-032  [P1] GAP  facet F06  effort S
- Legacy: Client saves via savingRef to prevent concurrent submit. `docs/legacy-source/frontend/src/pages/placements/index.js:33`
- vNext now: Only busy state, no synchronous guard. `src/components/placements/public-recruit-from-us.tsx:22`
- Fix: Use `useRef` in-flight lock.

## G2-11-001-035  [P1] GAP  facet F07  effort S
- Legacy: Whitespace name error `Enter your name`. `docs/legacy-source/frontend/src/pages/placements/index.js:94`
- vNext now: HTML required permits whitespace until server rejection. `src/components/placements/public-recruit-from-us.tsx:57`
- Fix: Trim-check and field message.

## G2-11-001-037  [P1] GAP  facet F07  effort M
- Legacy: Maps WRONG_CODE/EXPIRED/LOCKED and email errors to field with server message. `docs/legacy-source/frontend/src/pages/placements/index.js:5`
- vNext now: API/client flatten typed errors into generic code fallback. `src/components/placements/public-recruit-from-us.tsx:33`
- Fix: Send safe message/code and attach field errors.

## G2-11-001-045  [P1] GAP  facet F10  effort S
- Legacy: POST recruit body has phone and note. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:41`
- vNext now: Client sends mobile and hiringFor. `src/components/placements/public-recruit-from-us.tsx:26`
- Fix: Explicitly map payload fields.

## G2-11-001-068  [P1] GAP  facet F18  effort M
- Legacy: Backend error JSON includes user-facing message. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicPlacementsPageController.java:76`
- vNext now: UI generic fallback when server errors. `src/components/placements/public-recruit-from-us.tsx:33`
- Fix: Use safe typed error message.

## G2-11-001-071  [P1] GAP  facet F20  effort S
- Legacy: savingRef guards rapid double submission. `docs/legacy-source/frontend/src/pages/placements/index.js:34`
- vNext now: Busy state only. `src/components/placements/public-recruit-from-us.tsx:22`
- Fix: Add ref/idempotency.

## G2-4-026-025  [P1] GAP  facet F06  effort M
- Legacy: Company optional (no required rule) (`docs/legacy-source/frontend/src/pages/placements/index.js:94-95`)
- vNext now: Company required (`src/components/placements/public-recruit-from-us.tsx:60-63`)
- Fix: Make company optional unless product decision explicitly changed.

## G2-4-026-089  [P1] GAP  facet F23  effort M
- Legacy: Company optional, code autofill, note1000 (`docs/legacy-source/frontend/src/pages/placements/index.js:89-108`)
- vNext now: Company required, no autofill, note1500, resend extra (`src/components/placements/public-recruit-from-us.tsx:55-85`)
- Fix: Restore 3 distinct legacy form contracts; retain resend only with documented approval.

## G2-11-001-033  [P2] GAP  facet F07  effort S
- Legacy: Empty email error `Enter your work email`. `docs/legacy-source/frontend/src/pages/placements/index.js:91`
- vNext now: Company email generic error at page level. `src/components/placements/public-recruit-from-us.tsx:17`
- Fix: Exact required text, tied to field.

## G2-11-001-034  [P2] GAP  facet F07  effort S
- Legacy: Malformed email `Enter a valid email`. `docs/legacy-source/frontend/src/pages/placements/index.js:91`
- vNext now: Native HTML validation and generic error. `src/components/placements/public-recruit-from-us.tsx:51`
- Fix: Restore exact message.

## G2-11-001-036  [P2] GAP  facet F07  effort S
- Legacy: OTP empty/pattern have distinct errors. `docs/legacy-source/frontend/src/pages/placements/index.js:103`
- vNext now: Single page-level 6-digit warning. `src/components/placements/public-recruit-from-us.tsx:20`
- Fix: Preserve both original messages.

## G2-11-001-039  [P2] GAP  facet F08  effort S
- Legacy: Code sent feedback includes server-normalized email. `docs/legacy-source/frontend/src/pages/placements/index.js:51`
- vNext now: Only input email is stored in sent. `src/components/placements/public-recruit-from-us.tsx:35`
- Fix: Return/use normalized email.

## G2-11-001-040  [P2] GAP  facet F08  effort S
- Legacy: Successful recruit shows Result icon + Thank you. `docs/legacy-source/frontend/src/pages/placements/index.js:85`
- vNext now: Text-only Thank you status section. `src/components/placements/public-recruit-from-us.tsx:42`
- Fix: Restore success Result icon/spacing.

## G2-4-026-033  [P2] GAP  facet F07  effort S
- Legacy: Missing/company email returns EMAIL_REQUIRED or COMPANY_EMAIL_REQUIRED with domain policy message (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:155-160`)
- vNext now: Generic company-work-email sentence (`src/components/placements/public-recruit-from-us.tsx:16-18`)
- Fix: Preserve exact email-specific codes and map to email field.

## G2-4-026-035  [P2] GAP  facet F07  effort M
- Legacy: Maps server error codes to email/name/code Form.Item field error (`docs/legacy-source/frontend/src/pages/placements/index.js:40-44`)
- vNext now: Single generic page error; no field mapping (`src/components/placements/public-recruit-from-us.tsx:28-37,78`)
- Fix: Restore field-level error location and clear when corrected.

## G2-4-026-036  [P2] GAP  facet F07  effort S
- Legacy: Client email errors `Enter your work email` / `Enter a valid email`; name `Enter your name` (`docs/legacy-source/frontend/src/pages/placements/index.js:91-94`)
- vNext now: Company email string and native required field (`src/components/placements/public-recruit-from-us.tsx:16-20,50-59`)
- Fix: Use exact validation copy for email/name.

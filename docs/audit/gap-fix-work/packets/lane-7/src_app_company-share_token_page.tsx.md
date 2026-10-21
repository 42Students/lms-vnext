# Work packet: edit src/app/company-share/[token]/page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/company-share-token.md, docs/audit/gap2/lane-15/l20-u031-public-pages.md, docs/audit/gap2/lane-20/public-share-controller.md

## G2-1-029-011  [P1] GAP  facet F03  effort L
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:156-160: ZIP+Download list buttons in Card extra.
- vNext now: src/app/company-share/[token]/page.tsx:104-109: details disclosure with CSV link, no ZIP.
- Fix: Restore authorized ZIP or formally retire with clear capability notice.

## G2-1-029-028  [P1] MISSING  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:151: optional email send action after info.emailCodeAvailable.
- vNext now: src/app/company-share/[token]/page.tsx:29-45: absent.
- Fix: Add conditional Send code action only for verified recipient.

## G2-1-029-038  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:90: sendShareCode(token) provider side effect.
- vNext now: src/app/company-share/[token]/page.tsx:29-45: no send-code control, service not routed from this page.
- Fix: Reconnect verified code delivery with anti-pumping caps.

## G2-1-029-067  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:90-100: resend provider status TOO_SOON/LIMIT and 15minute code.
- vNext now: src/app/company-share/[token]/page.tsx:29-45: no link resend; future integration needed.
- Fix: Link provider with per-recipient rate limits and no PII leakage.

## G2-20-031-011  [P1] MISSING  facet F03  effort M
- Legacy: Legacy share password card has six-digit input, Open, optional 'Email me a code instead', ZIP and CSV buttons `company-share/[token].js:145-162`.
- vNext now: vNext share code form, applicant filter, download options `src/app/company-share/[token]/page.tsx:29-43,83-108`; email-code link and ZIP action not in top-level page.
- Fix: Implement parity for resend code and ZIP resume archive only if backed by supported vNext service; otherwise explicitly mark migration decision and disable unavailable control.

## G2-20-031-024  [P1] MISSING  facet F08  effort M
- Legacy: Legacy share `sendShareCode` distinguishes SENT, TOO_SOON, LIMIT with 15-min/1-min copy `company-share/[token].js:85-100`.
- vNext now: vNext `/company-share` top-level form has no send-code affordance `src/app/company-share/[token]/page.tsx:29-43`.
- Fix: Restore bounded resend-code path and differentiated transient/toast outcomes if vNext backend supports it.

## G2-20-031-027  [P1] GAP  facet F10  effort L
- Legacy: Legacy share GET /api/v1/public/share/{token}, POST /open, /send-code, /resumes, /downloaded `PublicShareController.java:17-57`.
- vNext now: vNext server reads via `src/app/company-share/[token]/page.tsx:20-24`; form POST `/company-share/{token}/access`, export via model `:35-42,104-107`.
- Fix: Map every legacy share action to new server action; verify access logging, resend and ZIP beyond CSV; preserve token confidentiality.

## G2-20-031-036  [P1] MISSING  facet F14  effort M
- Legacy: Legacy public share downloads CSV client-side and resumes ZIP with action logging `company-share/[token].js:106-125,156-160`.
- vNext now: vNext downloadable applicant export only via `src/app/company-share/[token]/page.tsx:104-107`.
- Fix: Expose ZIP if still supported or document product omission; audit export headers, filename, safeHref and download logs.

## G2-20-025-003  [P1] MISSING  facet F03  effort M
- Legacy: Send code email docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:37-40
- vNext now: Only manual code src/app/company-share/[token]/page.tsx:31-43
- Fix: Add email code

## G2-1-029-033  [P2] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:93: TOO_SOON info toast says code emailed less than minute ago; last code still works.
- vNext now: src/app/company-share/[token]/page.tsx:29-45: no matching state.
- Fix: Add resend-throttle guidance.

## G2-1-029-034  [P2] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:94: LIMIT warning about several codes/hour.
- vNext now: src/app/company-share/[token]/page.tsx:29-45: no matching state.
- Fix: Show send-cap state without leaking recipient.

## G2-1-029-035  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:95,99: ambiguous send and provider-error warning toasts.
- vNext now: src/app/company-share/[token]/page.tsx:24-28: only generic page unavailable.
- Fix: Surface send status and retry guidance.

## G2-20-025-007  [P2] GAP  facet F07  effort S
- Legacy: 404 SHARE_INVALID docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:23-25
- vNext now: Invalid UI and code failure src/app/company-share/[token]/page.tsx:33-51
- Fix: Uniform response

## G2-1-029-029  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:77: 400/401/403 errors show toast 'That code did not work, or this share is no longer available.'.
- vNext now: src/app/company-share/[token]/page.tsx:33-34: same copy inline role=alert with ?access=invalid.
- Fix: Match toast feedback timing and placement if strict clone.

## G2-20-031-022  [P3] GAP  facet F07  effort S
- Legacy: Legacy share invalid-code `message.error('That code did not work, or this share is no longer available.')` `company-share/[token].js:74-78`.
- vNext now: vNext route shows inline access-invalid message via `src/app/company-share/[token]/page.tsx:29-43`.
- Fix: Preserve exact error copy/placement or record intentional accessible inline-message change.

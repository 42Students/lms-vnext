# UX-G047 — Company applicant share, public token

Scope: `/company-share/[token]`: page, loading, error, not-found; shared code entry, email-code request, selected-column shortlist, search, pagination and CSV export. Owner `chat-ux-recruiter-public-batch-2026-11-07`.

## UX and security improvements

- Token-bearing applicant link explicitly uses Next `Metadata` with `force-dynamic`, `robots: noindex,nofollow,noarchive` and `referrer: no-referrer`. A share URL must not appear in search, browser previews or outgoing referrers.
- Temporary provider error retains same-link retry with a >=44px action even on narrow phones. Expired or withdrawn tokens remain noninteractive, with safe placement-cell instructions; missing code never reveals a private shortlist.
- Existing client is unchanged: one accessible six-character code field, rate-limited authenticated email-code option, `safeCompanyShareColumns`, selected-column `DataTable` with mobile cards, search, page links, CSV, expiring link and confidentiality watermark.

## Required acceptance

- Source/privacy/contract checks: `tests/ux-g047-g083-g084-contract.test.mjs`.
- Real page branches `tests/unit/chat16-public-company-share-page-16.test.ts`: CODE_REQUIRED, invalid/revoked, service failure and READY with unselected PII absent; explicit noarchive and no-referrer assertions.
- Access control: `tests/unit/security-company-share-code-form.test.ts`, `tests/unit/company-share-code-live-grant-guard.test.ts`; no cross-site verification, oversized input, arbitrary email recipient, unauthorized grant or unsupported expiry.
- Responsive field parity: `tests/unit/company-share-mobile-cards.test.ts`.
- Browser `tests/e2e/ux-g047-g083-g084-recruiter-journeys.spec.ts`: unauthenticated invalid share at 1280×800 and 320×720; safe denial/retry, privacy metadata and no applicant list/OTP action.

## Regression and privacy review

No changes to code issuance, rate limits, cookie proofs, tenant/relationship authorization, per-document access grants, selected columns or export authorization. External resume/portfolio URLs remain HTTPS-only, credential-free, checked before rendering. Browser checks do not inject/impersonate a real applicant or claim production recruitment authorization. Exact SHA/CI/screenshots required before DONE.

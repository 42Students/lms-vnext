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


## Executed closure evidence — 2026-11-07

- **Exact accepted SHA:** `5db9b53ce1c7fcd9cea96412812c25a51c378e21`; the Company Share page's blob SHA is unchanged on latest `main`.
- **[Successful scoped CI](https://github.com/42Students/lms-vnext/actions/runs/42392314518)**: ESLint, source privacy contracts, existing share page/CSRF/code proof/active grant/selected-column regression suites and Chromium checks passed.
- **[Screenshots and traces](https://github.com/42Students/lms-vnext/actions/runs/42392314518/artifacts/13581663762)**: `company-share-invalid-desktop.png` (1280×800) and `company-share-invalid-mobile.png` (320×720) reviewed. No clipping, usable denial instructions, safe Home action, no code entry or applicant list visible.
- SSR unit tests exercised CODE_REQUIRED, READY with selected columns and missing sensitive data, revoked/expired state, and simulated provider failures; the browser run exercises unauthorized/invalid access. Real external applicant export credentials and production data were not used.
- Source unchanged after accepted SHA; server-side grant, expiry, proof, audit, CSV and row-level tenant access policies remain intact.

**UX-G047: DONE after scoped acceptance.**

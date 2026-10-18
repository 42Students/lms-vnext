# Chat-16 public/auth page-level journeys

Source contract and pure-function tests cover:
- Login and root OTP entry, expired/revoked session next steps, same-origin return destinations, browser-safe denial and legacy handoff retirement.
- Legacy Super Admin bookmarks never provide privileged bypass.
- College and company invitation preview fallbacks preserve unconsumed tokens, with scoped retry to the same origin.
- HR invitation alias rejects malformed and external tokens before forwarding to the existing recruiter invite landing.
- Campaign unsubscribe GET is preview-only; explicit POST with same-origin credentials and a validated redirect is necessary, with double-submit guard and friendly error.
- Marketing pages, public share, privacy policy and two College Admin legacy redirects: additional cases in `UX-public-landing-coverage-02`, `UX-public-legacy-redirects-02`, and `UX-college-admin-role-redirects-02`.

Checks are source and pure-model assertions. Browser keyboard/mobile, live provider, security scanner and PostgreSQL integration execution still need CI/harness validation. No claim of production readiness is made.

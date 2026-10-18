# UX rollout — /company-join/[token]

- Scope: company token route and the same approved shared `PublicRecruiterJoinForm` / `PublicJoinPreviewRetry`; source test `UX-company-join-01`.
- Changes: shared input/button/card/notice components, responsive single-column controls on 320px, error-summary keyboard focus, pendingGuard for send-code and join, 44px links and a bounded retry; all changes land once in shared code rather than two drifting forms.
- Kept the company-domain proof, existing heading/copy, required email and name, six-digit code, resend flow, company-scoped send/join endpoints, link readiness, safe retry on failed preview and unchanged successful sign-in link.
- Test: `tests/unit/UX-company-join-01.test.ts` authored; CI/browser/keyboard evidence unrun; checklist pending test pass.

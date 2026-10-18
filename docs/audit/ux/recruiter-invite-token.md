# UX rollout — /recruiter-invite/[token]

- **UX ID:** UX-recruiter-invite-token-01. `RecruiterInviteLanding` remains the single canonical invitation workflow, preserves preview token scope and POST endpoints for opened / send-code / accept / not-hiring / unsubscribe. No legacy words were renamed.
- **Prior UX:** bespoke tiny-looking input/button styles, ad-hoc pulse rectangles, request errors without focus management, a potential rapid double-submit before `busy` state settled, min-h-screen on WebViews, public error screen with dashboard escape.
- **Improvements:** shared `Card`, `Input`, `Button`, `Skeleton`, `InlineNotice`; phone-first min-h-dvh shell with padding and one-column controls; ≥44px action targets and focus outlines; move keyboard focus to safe inline submission error; synchronous `busyRef` guards for decline, send-code and accept; bounded external fetch cancellation; route skeleton and public-safe failure recovery.
- **States:** loading, transient load error with Retry, expired/used invite, ready, sent-code, wrong/expired OTP failure, declined, joined, already-have-account sign-in. Existing entry and code values stay on error; client does not grant access.
- **Tests:** `tests/unit/UX-recruiter-invite-token-01.test.ts` authored. CI/browser/AT evidence pending; do not tick route before test pass.

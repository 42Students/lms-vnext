# UX rollout — /hr-invite/[token]

- **UX ID:** UX-hr-invite-token-01. Ownership: chat-16. Route remains a validated, redirect-only compatibility alias to `/recruiter-invite/[token]`, using `recruiterInviteHref` and `notFound()` for invalid tokens.
- **Decision:** no duplicate invitation form, response parser or deprecated accept endpoint. The canonical recruiter invite owns the actual form, existing copy and state machine. The alias does not store, transmit or display token contents except via the validated same-origin route.
- **Updated:** route loading uses the shared bounded `GracefulPageLoading` in a centered phone-first public frame; route errors use `GracefulErrorBoundary` with a public safe home destination instead of an authenticated dashboard.
- **States:** validating/redirecting, invalid link 404, route-level load/error. No new wording or invitation mutation.
- **Tests:** `tests/unit/UX-hr-invite-token-01.test.ts`. Source check authored; TypeScript, Vitest, 320/360/390px, WebView and assistive technology checks not executed by this lane. Leave inventory checkbox pending formal passing tests.

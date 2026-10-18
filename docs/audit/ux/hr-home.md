# UX rollout — /hr/home

- **Route:** src/app/(authenticated)/hr/home/page.tsx
- **Test:** UX-hr-home-01 (`tests/ux-hr-rollout-02.test.mjs`).
- **Initial weakness:** 18 low-contrast `text-primary-text` utility occurrences and missing keyboard-visible link/button focus; some independent native fields used small phone text.
- **Change:** Preserved all words, exact status names, API permissions and server reads/writes. Updated to readable deep-teal link utility, consistent 2px keyboard focus outlines on 25 links and 0 buttons, and 44px targets/phone input typography on 0 native fields. Kept shared page and state primitives and original guarded workflows.
- **States:** Original authentication, no-access, invalid query, empty/loading, conflict and pagination handling is unchanged; no new implied server behavior. Capture/AT remains orchestrator-owned.
- **Validation:** Named source invariant regression test authored; no local npm typecheck, lint, browser or device execution claimed.

## Shared recruiter shell, second pair of eyes (chat-19)

- HR-BREAK-ACTIVE-BELL-34: The active shell bell no longer marks all notifications read on opening. The explicit Mark all read action requires a verified nonredirected receipt. Failed refreshes clear old private notices. Added 44px keyboard actions, Escape/focus return, and a labelled ScrollCue.
- HR-BREAK-BELL-PAYLOAD-35: Parse and bound the bell's notice rows, date, unread count and recruiter-only job links before rendering.
- HR-BREAK-BELL-RACE-30: Alternative recruiter notification drawer also discards out-of-order college results.
- Evidence: `tests/unit/HR-BREAK-chat19-active-bell.test.tsx`, `HR-BREAK-chat19-bell-payload.test.ts`, `HR-BREAK-chat19-bell-race.test.tsx`. Browser and CI not run.

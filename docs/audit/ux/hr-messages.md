# UX rollout — /hr/messages

- **Route:** src/app/(authenticated)/hr/messages/page.tsx
- **Test:** UX-hr-messages-01 (`tests/ux-hr-rollout-02.test.mjs`).
- **Initial weakness:** Messages alias risks diverging from the actual conversations inbox.
- **Change:** Kept the direct messages-to-conversations re-export and existing exact legacy copy.
- **States:** Original authentication, no-access, invalid query, empty/loading, conflict and pagination handling is unchanged; no new implied server behavior. Capture/AT remains orchestrator-owned.
- **Validation:** Named source invariant regression test authored; no local npm typecheck, lint, browser or device execution claimed.

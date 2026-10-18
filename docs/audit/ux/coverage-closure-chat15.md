# Chat-15 UX coverage closure · 2026-10-18

- Tracker reporter routes: tests/unit/UX-tracker-mine-chat15-01.test.ts covers platform denial, feature flag, empty/error copy, safe details URL, invalid identity, scoped report access, and IST timestamp.
- Four shared primitives: tests/unit/UX-ui-primitives-chat15-01.test.ts names and tests bottom-sheet, loading-state, selection-controls and use-confirm-flow behaviour.
- HR/tracker/verification overlays: tests/unit/UX-hr-tracker-overlays-chat15-01.test.ts covers shared report drawer, recruiter bell, cancel-confirmation, audited status change and verification review.
- Scroll and motion: tests/unit/UX-chat15-scroll-motion-01.test.ts; implementation notes in docs/audit/ux/scroll-motion-chat-15.md.
- HR policy boundaries: tests/unit/hr-recruiter-exhaustive-chat15-01.test.ts tests round schema, ownership, proposal confirmation, unread aggregation, trusted domains, approval and grant validity.

**Remaining:** all other overlays in matrix, database-backed handler security tests, HR/tracker page-level partial and denied state verification, and full audit against the 21-point rubric. /recruiter route aliases and redirected /hr pages should not be marked complete solely for importing/redirecting. No owner waiver is claimed.

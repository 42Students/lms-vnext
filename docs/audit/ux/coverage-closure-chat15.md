# Chat-15 UX coverage closure · 2026-10-18

- Tracker reporter routes: tests/unit/UX-tracker-mine-chat15-01.test.ts covers platform denial, feature flag, empty/error copy, safe details URL, invalid identity, scoped report access, and IST timestamp.
- Four shared primitives: tests/unit/UX-ui-primitives-chat15-01.test.ts names and tests bottom-sheet, loading-state, selection-controls and use-confirm-flow behaviour.
- HR/tracker/verification overlays: tests/unit/UX-hr-tracker-overlays-chat15-01.test.ts covers shared report drawer, recruiter bell, cancel-confirmation, audited status change and verification review.
- Scroll and motion: tests/unit/UX-chat15-scroll-motion-01.test.ts; implementation notes in docs/audit/ux/scroll-motion-chat-15.md.
- HR policy boundaries: tests/unit/hr-recruiter-exhaustive-chat15-01.test.ts tests round schema, ownership, proposal confirmation, unread aggregation, trusted domains, approval and grant validity.

- HR round editor native modal: tests/unit/UX-hr-round-editor-chat15-01.test.ts verifies shared focus/keyboard dialog with guarded mutation.
- HR raw tables: tests/unit/UX-hr-data-tables-chat15-01.test.ts verifies single responsive DataTable, 10 company report fields, 5 grant fields and explicit empty states.
- HR slot, schedules, offers, drafts, deadlines, messaging, team search: tests/unit/hr-recruiter-exhaustive-chat15-02.test.ts covers state transitions, validation, calendar, masking, safe CSV and optimistic proposals.

- Canonical HR pages: tests/unit/UX-hr-page-states-chat15-01.test.ts names all 22 /hr routes and checks role-gating, alternate-state copy, and safe legacy redirects/aliases.

- Secondary owned overlay pass: tests/unit/UX-chat15-overlays-second-pass.test.ts checks 4 surfaces and correct notification-vs-message navigation.
- HR API safe body consumption: tests/unit/hr-recruiter-json-request-chat15-01.test.ts checks actual streaming parser failure cases; tests/unit/hr-recruiter-route-security-chat15-01.test.ts audits 10 mutating endpoints for same-origin, authorization context and replay.

- Shell and learner activity: tests/unit/UX-chat15-shell-activity-components-01.test.ts names learner bell, mobile navigation focus trap, route announcer and learner announcement inbox, with follow-up scroll-fade implementation on bell.
**Remaining:** all other overlays in matrix, database-backed handler security tests, HR/tracker page-level partial and denied state verification, and full audit against the 21-point rubric. /recruiter route aliases and redirected /hr pages should not be marked complete solely for importing/redirecting. No owner waiver is claimed.

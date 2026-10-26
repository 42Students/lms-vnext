# Screen #13: Find / Bell / Profile — actionable prototype/code audit

**Original screenshot:** `Find, bell, profile.png` from `42LMS pages prototype-png-faculty.zip`. **Route:** `/teacher (shared topbar)`.
**Queue status:** NEEDS-ACCEPTANCE. **Visual screenshot acceptance: PENDING**.
**Evidence:** [Earlier workflow 40296795155](https://github.com/42Students/lms-vnext/actions/runs/40296795155), not a current-code sign-off.

## Source files compared

- [`src/components/shell/topbar/command-search.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/shell/topbar/command-search.tsx)
- [`src/components/shell/topbar/faculty-find-suggestions.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/shell/topbar/faculty-find-suggestions.tsx)
- [`src/components/shell/topbar/notification-actions.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/shell/topbar/notification-actions.tsx)
- [`src/components/shell/topbar/account-menu.tsx`](https://github.com/42Students/lms-vnext/blob/main/src/components/shell/topbar/account-menu.tsx)
- [`tests/e2e/faculty-prototype-find.spec.ts`](https://github.com/42Students/lms-vnext/blob/main/tests/e2e/faculty-prototype-find.spec.ts)
- [`tests/e2e/faculty-notifications.spec.ts`](https://github.com/42Students/lms-vnext/blob/main/tests/e2e/faculty-notifications.spec.ts)

## Concrete adversarial gaps, preserved behavior and proof

Unchecked CODE means implementation exists, not verified. Record commit+run before checking off.

- [ ] **F13-01 · P0 · CODE:** Scoped grouped suggestions for Students, Colleagues, Courses and pages.
- [ ] **F13-02 · P0 · OPEN:** Ctrl/Cmd+K keyboard focus test failed in run 40296795155.
- [ ] **F13-03 · P0 · VERIFY:** Enter activates current authorized suggestion, never stale or fallback.
- [ ] **F13-04 · P1 · VERIFY:** Popovers Escape/outside-click/focus return and mobile state.
- [ ] **F13-05 · P0 · VERIFY:** Bell count from capped notification API must not claim exact count over cap.
- [ ] **F13-06 · P0 · CODE:** Cross-college notification read/read-all isolated in dedicated E2E.
- [ ] **F13-07 · P1 · VERIFY:** Profile My Account, switch workspace, sign-out and expired session.
- [ ] **F13-08 · P1 · VERIFY:** Find overlay z-index, viewport clipping, consistent panel positioning.
- [ ] **F13-09 · P1 · VERIFY:** Short query, loading, empty, retry, abort, stale request behavior.
- [ ] **F13-10 · P2 · VISUAL:** Search field, avatars, groups, badge, header spacing.

## Universal gates — never skipped

- [ ] Desktop rendered screenshot compared against original uploaded PNG, with annotated differences.
- [ ] 390px mobile/keyboard/accessible names/focus/overflow.
- [ ] Cross-tenant/direct deep-link authorization and confidential-data isolation.
- [ ] State transitions with persisted verification, conflicts and network-unknown recovery.
- [ ] Empty, loading, unavailable and historical data.
- [ ] Current-code targeted browser+typecheck/unit proof, not historical green run.
- [ ] Separate visual sign-off with approved waivers only.

Update both this checklist and [the Faculty closure ledger](00-closure-ledger.md) with evidence before advancing.

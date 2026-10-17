# Chat-9 shell dependencies — source verification

Tests were authored but not run by the builder; orchestrator confirms execution and browser behavior. DONE is source-level only.

| ID | Status | Evidence |
|---|---|---|
| TPO-inbox-team-28 | DONE | `src/components/shell/sidebar-nav.tsx`; `tests/unit/chat9-shell-unread-graceful.test.ts` — `TPO-inbox-team-28 validates distinct Messages and Team unread counts without fabricating zero` |
| TPO-inbox-team-63 | DONE | `src/components/shell/shell-counts-model.ts`; `tests/unit/chat9-shell-unread-graceful.test.ts` — `TPO-inbox-team-63 and TPO-requests-verification-06 preserve unknown badges instead of treating failure as empty` |
| TPO-requests-verification-06 | DONE | `src/components/shell/sidebar-nav.tsx`; `tests/unit/chat9-shell-unread-graceful.test.ts` — `TPO-inbox-team-63 and TPO-requests-verification-06 preserve unknown badges instead of treating failure as empty` |
| TPO-requests-verification-21 | DONE | `src/components/shell/app-shell.tsx`; `tests/unit/chat9-shell-tpo-graceful-topbar.test.ts` — `TPO-requests-verification-21 only includes Verification when authorization explicitly enables it` |
| LEARNER-profile-misc-R01 | DONE | `src/components/shell/learner-notification-bell.tsx; src/components/shell/learner-topbar-tools.tsx`; `tests/unit/chat9-shell-notifications-auth-graceful.test.ts` — `LEARNER-profile-misc-R01 opens the eight-item guarded learner notification drawer` |
| TPO-home-40 | DONE | `src/components/shell/app-shell.tsx`; `tests/unit/chat9-shell-tpo-graceful-topbar.test.ts` — `TPO-home-40 avoids duplicate Notifications links in TPO accounts` |
| TPO-home-44 | DONE | `src/components/shell/app-shell.tsx`; `tests/unit/chat9-shell-tpo-graceful-topbar.test.ts` — `TPO-home-44 shows Messages in the global TPO topbar instead of requiring a Home-only widget` |
| PUB-auth-public-20 | DONE | `src/components/shell/account-actions.tsx`; `tests/unit/chat9-shell-notifications-auth-graceful.test.ts` — `PUB-auth-public-20 and PUB-auth-public-21 coordinate cross-tab logout with guarded session requests` |
| PUB-auth-public-21 | DONE | `src/components/shell/account-actions.tsx`; `tests/unit/chat9-shell-notifications-auth-graceful.test.ts` — `PUB-auth-public-20 and PUB-auth-public-21 coordinate cross-tab logout with guarded session requests` |
| PUB-auth-public-22 | DONE | `src/components/shell/membership-switcher.tsx`; `tests/unit/chat9-shell-notifications-auth-graceful.test.ts` — `PUB-auth-public-22 keeps the membership selector usable after an API failure` |
| PUB-auth-public-24 | DONE | `src/components/shell/shell-connectivity-notice.tsx`; `tests/unit/chat9-shell-tpo-graceful-topbar.test.ts` — `GR-16 PUB-auth-public-24 shows an offline notice and removes it on reconnect` |

Remaining: PUB-auth-public-29/31 global membership-switching and sign-in edge conditions require further role-journey acceptance; not marked DONE.

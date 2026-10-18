# chat-16 adversarial defects and verification (2026-10-18)

Scope: HR/Recruiter messaging, email bridge, notification bell, public/auth route regression tests.
All fixes below are **authored on `chatgpt/chat-16-b`, not claimed as passing CI or browser integration**.
The GitHub-only session does not expose a local checkout, PostgreSQL, package installation, or a Vitest process.

| Defect | Severity | Journey and evidence | Fix commit | Regression test | Status |
|---|---|---|---|---|---|
| CHAT16-MAIL-01 / REC-calendar-messages-profile-R01 | S2, message privacy | An authenticated reply containing `Begin forwarded message:`, a multi-hyphen forwarded delimiter, or a `Sent:` mail-history header was preserved by `extractRecruiterEmailReply`. Quoted history could be stored as a fresh recruiter reply. | `74381570d886263b00df629a1c316044455d4906` | `tests/unit/chat16-email-bridge-hardening-02.test.ts` (forwarded history and header cutoffs) | Code patched; CI verification pending |
| CHAT16-MAIL-02 / REC-calendar-messages-profile-R01 | S2, delivery safety | Reply-To domain validation accepted DNS labels beginning or ending with hyphens, 64-character labels, and overly long hostnames. Invalid addresses could be passed to a provider. | `60fb3d48b757d92f4c0b5ab2e139d0e539aaa0eb` | `tests/unit/chat16-email-bridge-hardening-02.test.ts` (invalid label and length checks) | Code patched; CI verification pending |
| CHAT16-BELL-01 / REC-calendar-messages-profile-21 | S2, duplicate mutation | The notification bell's `markAll()` guard depended on React's asynchronous `loading` state. Two same-tick calls before the next render could both POST read receipts. | `5df3075ffbfa90e88d67d4d9dc430326ceddfce1`, `8fe1bffbf47d63c8e74e98a0d6457d3845021519` | `tests/unit/chat16-hr-bell-double-submit-03.test.ts` (single-flight, rejected network call, independent instances) | Code patched; CI verification pending |
| CHAT16-TEST-01 / SA-tenants-modules-25 | S3, stale test | A test assumed `college.modules.map(decision` although the actual Feature Controls table renders columns via `OPTIONAL_MODULE_KEYS.map` and finds each module decision per college. The source test failed without demonstrating a product regression. | `058e738361156e1b9660dd98a3c520472fdae1b3` | `tests/unit/chat16-final-sa-tenants-modules-25.test.ts` now asserts per-module column identity, decision lookup, and editor | Test patched; CI verification pending |
| CHAT16-UX-01 / UX-e2e-superadmin-login-01, UX-privacy-policy-01, UX-college-admin-departments-01, UX-college-admin-programs-01 | S3, missing route coverage | These public and legacy bookmark routes appeared without a UX test mention in the generated coverage matrix. | `778e58a33e819c2960251ff0414e392bbedf67d1`, `44f082cad32404b54c78e026eb7f46b21188e2f8` | `tests/unit/UX-chat16-public-auth-legacy-bookmarks-03.test.ts` imports and executes the actual pages, checks allowed and denied redirect paths | Authored; CI verification pending |

## Release gates and known limitations

- New tests and previous failing chat-16 test files have **not** been executed from this connection. No green claim.
- The latest orchestrator typecheck report lists three errors owned by other lanes, none in chat-16 source; running an updated compiler is required to confirm this state remains true.
- The current unit-failure report includes older gap-register reconciliation checks. Since the canonical register is generated and reviewed by other lanes, this lane did not hand-edit it or relax its inventory assertions.
- Provider-accepted email is not proof of successful inbox delivery. A signed gateway, configured ZeptoMail key, real provider round trip, and PostgreSQL rollback/locking tests are required before enabling recruiter inbound replies in production.
- College switching, expired sessions, real browser focus/scroll behavior and mail-provider outages still require full integration and browser harness runs. The tests authored here cover a bounded subset, not exhaustive journey certification.

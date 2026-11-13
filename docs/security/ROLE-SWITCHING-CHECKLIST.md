# Role switching, topbar and sidebar: exhaustive checklist

Date: 2026-11-12
Scope: code, migrations and read-only live dev checks. No GCP changes.

Legend: `[x]` checked and fine, `[ ]` not checked yet, `[!]` known gap.

Status (2026-11-13): 103 items — 48 checked against code/tests, 9 known gaps, 46 unchecked or requiring verification. Deployment/browser evidence is tracked separately.

## A. Data model (database)

- [x] 1. `users.platform_status` is `ACTIVE` or `DISABLED`. A disabled user fails everywhere.
- [x] 2. `college_memberships` has one row per user per college (unique index). Statuses are `ACTIVE`, `SUSPENDED` and `ENDED`, plus `suspended_at`.
- [x] 3. `membership_roles` holds roles per membership (unique on membership and role): `LEARNER`, `FACULTY`, `COLLEGE_ADMIN`, `MENTOR`, `TPO`.
- [x] 4. `system_roles` holds `SUPER_ADMIN`, not tied to a college.
- [x] 5. Recruiter data lives in separate tables (profile, company, company-college relationship, per-college grants). A grant must be active, verified, unexpired and carry the `DRIVES` capability.
- [x] 6. Foreign keys restrict deletes, so a membership can't vanish under its history.
- [x] 7. Row-level security covers the derived tables (migration 0338). `membership_roles` and `system_roles` are on the global or identity list.
- [ ] 8. Whether a DB constraint stops a membership from having zero roles or two conflicting roles. Today this is enforced in services only.
- [ ] 9. Index plan for `listMembershipChoices` at scale (a user with dozens of colleges).
- [x] 10. Legacy role labels are import evidence only, never a runtime grant (`resolveLegacyAccountRole`).
- [!] 11. "FACULTY id 0 means Super Admin" is a legacy rule, recorded as migration evidence and not used at runtime. Not checked that no import path creates a Super Admin from it.

## B. Session and cookies

- [x] 12. Three cookies: signed session, `lms_membership`, `lms_role`. The latter two are claims, re-checked every request.
- [x] 13. Sign-in and sign-out both clear the membership and role cookies.
- [x] 14. Session is first-party and HttpOnly. Native token-pair switching is retired (returns 410).
- [x] 15. Admin-scope cookie is encoded and paired with an expiry cookie.
- [x] 16. `secure` is on in production, or when `COOKIE_SECURE=1`.
- [ ] 17. Cookie lifetime. Membership and role cookies last up to 5 days (same as the session cap). Edge and long-open-tab behaviour unchecked.
- [ ] 18. What each cookie carries across a college host and the platform host (cookie domain behaviour).
- [ ] 19. The E2E identity bypass cookie (`E2E_*`) is gated by `APP_ENV` and a secret. Not confirmed it can't be enabled on any deployed host.
- [x] 20. A session can be revoked server-side; the devices list shows device sessions. Not checked that revoking a device also drops its role cookies (cleared on next request).

## C. Sign-in and role selection

- [x] 21. One role goes straight in. Several roles show "Choose your account".
- [x] 22. Super Admin sign-in needs both the SMS and email codes.
- [ ] 23. Whether Super Admin can reach the membership chooser (Super Admin only applies while no membership is selected).
- [x] 24. "Last used" in the chooser is a convenience stored in `localStorage` (`lms:last-selected-college`).
- [!] 25. The stale "Your code is on its way." banner stays on the chooser screen.
- [ ] 26. Email-link sign-in, learner roll-number sign-in and DGIPUC sign-in each have their own chooser path. Untested.
- [ ] 27. Login form behaviour when the account has no active memberships (recruiter-only user, e.g. the HR test account).
- [ ] 28. Sign-in on a college host for a user who is not a member of that college.
- [ ] 29. `returnTo` handling: a deep link into a portal for a role the user doesn't have, after signing in as another role.

## D. The switch itself (`/api/auth/memberships`)

- [x] 30. POST checks origin, applies the host-college rule, requires a single role, and rejects bad or unknown roles.
- [x] 31. Audit events for success and failure, 60-per-minute limit, rejected role claims logged.
- [x] 32. The 409 "open the other college's address" path for cross-host switches.
- [x] 33. GET membership chooser accepts a current active local membership even when no role has been selected, but does not accept a suspended/foreign identity. The explicit role-switch HTTP unit suite passed on exact SHA 472c6f12; deployed host/browser regression remains separate.
- [!] 34. The route is `auth: "public"` with a hand-written origin check. Deliberate: a stale cookie would otherwise block recovery.
- [ ] 35. Two tabs switching to different roles. Last cookie wins, so the first tab shows the wrong role until refresh.
- [ ] 36. What happens to unsaved forms and open pages in another tab after a switch.
- [ ] 37. The switch always redirects to `/dashboard`; it doesn't return the user to the previous page.

## E. Request context and tenancy

- [x] 38. `resolveRequestContext` checks user, active membership, active college and active organization.
- [x] 39. A membership without exactly one valid role throws `SESSION_INVALID`.
- [x] 40. Tenant rule: platform host serves any signed-in person; college host serves only members or granted recruiters of that college; unknown host serves nobody.
- [x] 41. College archived mid-session. A verified PostgreSQL integration test proves the selected college is rejected on the next request and removed from choices; another active college remains available. Deployed-browser check not performed.
- [x] 42. Membership suspended or ended mid-session, and user disabled mid-session. Verified PostgreSQL integration test covers all three changes and cross-college isolation. Deployed-browser check not performed.
- [x] 43. Tenant scope binds to the request for row-level security.
- [ ] 44. `app.rls_mode=enforce` in dev. Not every role's pages tested under it; auth routes work.

## F. Super Admin scope

- [x] 45. Organization and college scope through `/api/auth/admin-scope` (GET, POST, DELETE), re-checked against `admin-scope.select`, with security events.
- [x] 46. Scope switcher UI, including the "tenant lock" checkbox.
- [!] 47. The tenant lock is `localStorage` only, so it is not a security control.
- [ ] 48. Scope expiry (4 hours) while a page is open.
- [ ] 49. "All colleges" scope. The toast warns data may be large; page limits unchecked.
- [ ] 50. Super Admin idle timeout (30 minutes) and its effect on an open tab.

## G. Recruiters

- [x] 51. A recruiter profile with grants gives a recruiter-only sidebar of 5 items (when there is no membership).
- [x] 52. The recruiter bell endpoint answers only for recruiters.
- [x] 53. Combined membership plus recruiter profile: real PostgreSQL fixture and tenant-access unit tests passed on exact SHA 472c6f12. Host-scoped recruiter grants cannot supply another college's member role; combined sidebar is exercised. Deployed-browser confirmation remains separate.
- [ ] 54. A recruiter whose grant expires while signed in.
- [ ] 55. A recruiter switching between colleges. Grants are listed, but no UI to switch among them was found.

## H. Navigation (sidebar)

- [x] 56. Per-role item lists: Learner 8 (Placements and Projects gated by module access), Faculty 4, Mentor 3, TPO 8, College Admin 10, Super Admin 13, Recruiter 5.
- [x] 57. Module-access filtering of items (projects and placements).
- [x] 58. The Placement cell shortcut has a stable key.
- [x] 59. Links point at real routes (new test `shell-nav-routes-exist`).
- [x] 60. Multi-role sidebar code is documented as reached only by the recruiter-plus-membership case.
- [!] 61. Runtime role-portal gates have been unified for the eleven protected page families, including legacy aliases, and source-level seven-role navigation and denial tests plus Playwright cases committed. Await exact-SHA CI and browser execution before closure.
- [ ] 62. Sidebar badges for TPO and Faculty, and what they show if the count call fails.
- [ ] 63. Active-item highlighting for aliased paths (`/tpo/drives` and so on).
- [ ] 64. Super Admin and HR sidebars live.
- [ ] 65. Learner "My Placements" missing on dev. Probably module access; setting not checked.

## I. Topbar and account menu

- [x] 66. Per-portal search, "New" button and notification bell (`portal-config.ts`).
- [x] 67. Workspace switcher: desktop topbar trigger, mobile avatar menu. Lists are identical and intentional.
- [x] 68. Switcher tooltip and screen-reader label now name the active role.
- [!] 69. The visible trigger text is still only the college name.
- [x] 70. Account menu: "My Account" per role, "Logout", cross-tab sign-out via `localStorage` (`lms:signout`).
- [x] 71. Keyboard handling: Escape, arrows, Home and End, focus return.
- [ ] 72. Command search (Ctrl+K): destinations offered per role, and whether any result links to a page the role can't open.
- [ ] 73. "Report issue" launcher (Alt+B) for each role.
- [ ] 74. Avatar initials for long or non-Latin names.

## J. Notifications and live counts

- [x] 75. Per-role endpoints return 200 for their role and 403 for others (live).
- [ ] 76. `/api/notifications/stream` across a role switch (does the old stream close?).
- [ ] 77. 60-second polling in hidden tabs (code skips when `document.hidden`; not tested).
- [ ] 78. What the bell shows when the endpoint fails.

## K. Administration of roles

- [x] 79. Nobody can add or remove a role on their own membership (`MEMBERSHIP_SELF_ROLE_CHANGE`). A College Admin can't remove their own admin role.
- [x] 80. Suspend, reactivate and end have a protection check in the service and again in the repository.
- [ ] 81. Last active College Admin: live transaction safeguards cover role removal, membership SUSPEND/END and platform-wide user disable; 10 PostgreSQL tests and one HTTP test passed on exact SHA 472c6f12. Additional suspended-at edge-case regression is committed, awaiting its exact-SHA CI. No direct-SQL trigger or deployed-browser claim.
- [ ] 82. What an admin sees when removing a role from a user who is signed in.
- [!] 83. Dual approval for sensitive role changes is not built (needs a migration).
- [ ] 84. Bulk imports that create memberships and roles, and whether they pass the same protections.
- [ ] 85. Invitations and join links (`college-join`, `company-join`, `hr-invite`) and the roles they grant.

## L. Security, audit and logging

- [x] 86. Audit events for switches and admin-scope changes; DB trail on in dev.
- [x] 87. Rejected role claims go to the structured log (not the database).
- [ ] 88. Alert when one user switches roles unusually often or across many colleges.
- [ ] 89. Device-session views showing which role was active.
- [x] 90. Origin and CSRF coverage tested for every route (`api-origin-guard`).
- [ ] 91. Rate limiting by user, not just by IP, on the switch route.

## M. UX, copy and accessibility

- [!] 92. Mentor dashboard says "Your active roles share one landing page" for a single selected role (exact-wording rule: needs a yes).
- [!] 93. A revoked role sends the user to sign-in with a generic "session no longer valid" message.
- [x] 94. Mobile at 375px: no horizontal scroll, drawer opens, touch targets at least 44px.
- [ ] 95. Tablet widths and the 96px hover rail on desktop.
- [ ] 96. Screen-reader announcements after a switch, and focus position after navigation.
- [ ] 97. Dark mode or high-contrast behaviour of the switcher.
- [ ] 98. Loading states: the "Loading 42 LMS..." heading is visible on first paint on several pages.

## N. Tests and operations

- [x] 99. Unit tests for nav, topbar contracts, switch audit and the membership route.
- [ ] 100. End-to-end tests for switching (`core-platform.spec.ts` and others mention the switcher). E2E suite not run.
- [ ] 101. Seven-role matrix authored for 557 protected App Router pages and explicit classification of 14 shared authenticated pages (571 total); linked to actual parent layouts and selected browser negative cases. CI/browser execution and exhaustive API-method/resource authorization matrix remain open.
- [ ] 102. Runbook for "a user is stuck without a role".
- [ ] 103. Seed data: only two test accounts are multi-role. None with three or more roles, several colleges, or membership plus recruiter profile.

## Highest-risk unchecked items (suggested first batch)

41, 42, 53, 61, 81, 101.

## Evidence updates — 2026-11-13

- **41, 42 — isolated PostgreSQL / code verified:** [CI run 43367670164](https://github.com/42Students/lms-vnext/actions/runs/43367670164), exact SHA `4ea11cfbb0d2b5049aeb080f0533bdd3d07c004a`, database job **success**, `tests/integration/security-live-workspace-revocation.test.ts` **2/2 passed** (overall DB matrix 1,898 passed, 377 skipped). This is not a live-dev session replay and the overall CI workflow had separate lint failures.
- **33 — reopened, CI pending:** `hostCollegeScope` resolved an unselected identity, then used a workspace-only host guard; this denied valid member-only accounts on their own college host. Repaired with current active membership choices; negative foreign/inactive cases added. Do not close until the new exact-SHA unit/DB evidence is green.
- **53 — implementation/tests in progress:** the college-host guard was tightened so a selected College A membership cannot borrow a College B recruiter grant; the request context now narrows recruiter grants to the verified college host. Added unit-level negative tests and an isolated PostgreSQL combined-account fixture. No deployed-browser verification yet; leave unchecked until the latest CI proves both.
- No GCP changes or live-dev data mutations were performed in this audit work.

- **81 — implementation committed, NOT yet verified/closed:** shared per-college transaction advisory lock and active-replacement check are now used by role removal, membership SUSPEND/END, and Super Admin platform account disable; a disabled or suspended purported replacement does not count. API returns `LAST_COLLEGE_ADMIN` (409); person and platform-block UIs show specific guidance. `tests/integration/security-last-college-admin.test.ts` exercises sole-admin denial, permitted replacement, disabled/suspended exclusions, and concurrent mixed writers. `tests/unit/security-last-college-admin-http.test.ts` covers the HTTP response. CI is pending. Direct SQL, bulk imports and deployed-browser checks have not yet been certified.

## Batch A verified and outstanding evidence — 2026-11-13

- **33 — checked for scoped HTTP contract:** [CI 43375087199](https://github.com/42Students/lms-vnext/actions/runs/43375087199), exact SHA `472c6f12b15ce87151d3ca8f08aa5112780b6241`: `tests/unit/security-explicit-role-switch-http.test.ts` 8/8 passed, including unselected active local membership and inactive/foreign denial. Deployed college-domain session replay remains an unverified browser scenario.
- **53 — checked for database and unit behavior:** same exact SHA and run: `tests/integration/security-combined-recruiter-membership.test.ts` 1/1 passed, `tests/unit/auth-tenant-access.test.ts` 12/12 passed, and `tests/unit/security-auth-context-role-boundary.test.ts` 6/6 passed. Deployed-browser check not performed.
- **81 — PostgreSQL guard proven at earlier SHA, new edge test pending:** same CI database job passed `tests/integration/security-last-college-admin.test.ts` 10/10, unit HTTP denial 1/1. Later patch excludes nominally ACTIVE memberships with non-null suspension timestamps; do not close until this exact-SHA regression is passing. Direct SQL callers do not participate in the application advisory lock.
- **61/101 — implemented, tests still awaiting execution:** `src/modules/identity/role-portal-policy.ts` now powers the canonical and alias role layouts; `tests/unit/security-role-page-matrix.test.ts` inventories 571 authenticated pages (557 protected + 14 shared/scoped), and `tests/e2e/role-portal-access-matrix.spec.ts` adds seven browser navigation cases. This proves neither every API method nor resource ownership automatically. Track API-level all-role matrix separately under 101.
- Overall CI run 43375087199 was **not green**: database, typecheck and build succeeded, while lint and 49 broader unit assertions failed. New Batch A test-run evidence must be reviewed before status changes for 61, 81 and 101.

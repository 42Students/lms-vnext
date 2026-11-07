# Shared / Public / Operational — Detailed Page Parity Spec

These surfaces are not owned by one authenticated sidebar but are part of replacing the legacy LMS safely.

# Authentication / account context

## Page: Tenant-aware root/login
**Legacy:** `/`, `/login`

Legacy responsibilities:
- tenant/host-aware login skin;
- phone/OTP identity;
- role/account resolution;
- post-login home routing;
- tenant branding;
- auth errors/retry;
- safe unknown-role handling.

- [ ] Identity Platform browser login is implemented and configured.
- [ ] tenant hostname resolves the correct branding/context.
- [ ] phone/OTP flow matches required product behavior.
- [ ] login error/rate-limit/expired-code states are explicit.
- [ ] successful login resolves memberships safely.
- [ ] unknown/no-membership state goes to chooser/recovery, never guessed Learner.
- [ ] role home routing is deterministic.
- [ ] logout/session expiry returns to correct login.
- [ ] mobile login behavior is verified.
- [ ] branding asset storage remains explicit BLOCKED until Cloud Storage is live.

## Page: Super Admin Login
**Legacy:** `/superadmin-login`

- [ ] Product decision: unified Identity Platform login or separate hardened Super Admin entry.
- [ ] If redesigned, rationale is recorded in master matrix.
- [ ] Super Admin IP/policy requirements remain enforceable.
- [ ] no legacy separate-login bookmark becomes a security bypass.

## Flow: Cross-domain Auth Handoff
**Legacy:** `/auth/handoff`

Legacy has progress/failure handling with Back to Login and Retry.

- [ ] define whether cross-host/custom-domain token handoff remains needed.
- [ ] consume token exactly once.
- [ ] validate issuer/audience/expiry/origin.
- [ ] select/restore intended membership safely.
- [ ] retry does not replay an already-consumed token unsafely.
- [ ] failure provides correct login fallback.
- [ ] no handoff secret appears in logs/client persistence.

## Flow: Membership Chooser / Switcher
vNext already has chooser/switcher.

- [ ] college cards/membership role context match user expectations.
- [ ] only ACTIVE memberships are selectable.
- [ ] switch is same-origin protected.
- [ ] deactivated membership cannot be selected with stale UI.
- [ ] switching refreshes all role/navigation/data context.
- [ ] clearing membership returns to chooser-valid state.
- [ ] recruiter/global college-less state is compatible.

# External company sharing

## Public Page: Company Applicant Share
**Legacy:** `/company-share/[token]`

Legacy:
- expired/revoked warning;
- 6-digit code gate;
- optional Email Me a Code;
- applicant table with configurable shared columns;
- resume links with safe URL handling;
- shortlist-by notice;
- Download All Resumes ZIP;
- Download List CSV;
- download audit logging.

- [ ] share token expiry/revocation matches.
- [ ] 6-digit code gate matches.
- [ ] brute-force/rate-limit protections exist.
- [ ] Email Me a Code flow matches where configured.
- [ ] only explicitly shared applicant fields are returned.
- [ ] resume link safety matches.
- [ ] shortlist-by deadline notice matches.
- [ ] CSV export matches shared fields only.
- [ ] resume ZIP generation matches authorized files only.
- [ ] list/ZIP/resume downloads are audited.
- [ ] invalid/revoked/expired states leak no applicant data.
- [ ] public page is responsive and accessible.

# Operational QA / Tracker

## Page: Report Issue
**Legacy:** `/tracker`

Legacy:
- no-login issue report;
- remembered reporter/account/environment context;
- unsaved draft restore/discard;
- context/location/issue type/description/severity/evidence;
- screenshot picker/upload;
- similar issues;
- create issue first so screenshot failure never loses report;
- screenshot retry;
- success with public issue id;
- View Issue / Report Another;
- Ctrl/Cmd+Enter submit.

- [ ] Product decision: migrate Tracker into vNext or retain as separate supported service.
- [ ] If migrated, report form fields/options match.
- [ ] draft restore/discard matches.
- [ ] screenshot upload/retry matches.
- [ ] report persists before attachments.
- [ ] similar-issue behavior matches.
- [ ] success/id/deep link matches.
- [ ] keyboard submit/accessibility matches.
- [ ] abuse/rate-limit/public-data policy is explicit.

## Page: Issues List
**Legacy:** `/tracker/issues`

- [ ] ownership decision matches Report Issue.
- [ ] filters/search/sort/pagination match.
- [ ] saved filters/views match.
- [ ] issue status/severity/context columns match.
- [ ] open detail deep link matches.
- [ ] loading/empty/error states match.

## Page: Issue Detail
**Legacy:** `/tracker/issues/[issueId]`

- [ ] issue fields/history/comments/attachments match.
- [ ] status/decision actions match authorized operator role.
- [ ] attachment preview/download safety matches.
- [ ] not-found/error states match.

## Page: Logs
**Legacy:** `/tracker/logs`

Legacy includes:
- Production/Development/UAT;
- time windows 15m/1h/6h/24h/7d;
- levels;
- search;
- grouped/ungrouped;
- pagination/load older;
- refresh/auto-refresh;
- stale state;
- new-since-last-visit;
- backend uptime;
- log detail/permalink;
- known errors;
- daily digest;
- test alert;
- Cloud Logging errors/rate limits;
- Log→Issue handoff.

- [ ] Product ownership decision: migrate or retain supported ops surface.
- [ ] environment/window/level/search filters match.
- [ ] grouped/ungrouped behavior matches.
- [ ] pagination/refresh/auto-refresh matches.
- [ ] rate limit pauses auto-refresh safely.
- [ ] stale-last-success state matches.
- [ ] new-since-last-visit state matches.
- [ ] log detail/permalink matches.
- [ ] Known Errors workflow matches.
- [ ] Daily Digest workflow matches.
- [ ] Test Alert workflow matches.
- [ ] Log→Issue draft handoff matches.
- [ ] Super Admin authorization is enforced server-side.

# Public marketing / legal

## Page: Marketing Home
**Legacy:** `/home`
- [ ] Product decision: keep separate legacy/public site or migrate.
- [ ] if retained separately, vNext cutover preserves route/host behavior.
- [ ] if migrated, all sections/CTAs/SEO metadata are audited before retirement.

## Page: Platform
**Legacy:** `/platform`
- [ ] ownership/cutover decision recorded.
- [ ] if migrated, content/CTA/SEO parity audited.

## Page: Universities
**Legacy:** `/universities`
- [ ] ownership/cutover decision recorded.
- [ ] if migrated, content/CTA/SEO parity audited.

## Page: Enterprises
**Legacy:** `/enterprises`
- [ ] ownership/cutover decision recorded.
- [ ] if migrated, content/CTA/SEO parity audited.

## Page: Request Demo
**Legacy:** `/request-demo`
- [ ] ownership/cutover decision recorded.
- [ ] lead/contact form submission destination remains functional.
- [ ] validation/success/error states preserved.

## Page: Privacy Policy
**Legacy:** `/privacy-policy`
- [ ] legal owner decides retained vs migrated route.
- [ ] cutover never produces a missing privacy-policy link.
- [ ] current policy content/version/source is verified before launch.

## UX-G068, UX-G051, UX-G085 — Public recovery and demo-contact UX (7 November 2026)

These are **three independent status groups** in the sole canonical `docs/tracker.json#uxReview.groups`. They share one focused browser suite, but closure is recorded against each group separately; they do not certify the broader GR, parity, security or release programs.

### UX-G068: maintenance recovery — `/maintenance`

**Source:** `src/app/maintenance/page.tsx` and `maintenance-recovery.tsx`. This newer route was absent from the old generated 2,080-entry registry and appears in the supplementary 83-route census. The route retains noindex/nofollow metadata, sign-in fallback and branded public shell.

**Scoped improvements:** explicit Try again attempts the **fixed same-origin** `/dashboard` path, delegating maintenance/auth/role rules to the normal application; offline browser state blocks navigation with visible and screen-reader announced recovery guidance. No timer, automatic page loop, or backend authorization/maintenance setting was modified. `navigator.onLine` is a network hint, never an authoritative health check.

### UX-G051: access-denied recovery — `/forbidden`

**Source:** `src/app/forbidden/{page,loading,error}.tsx`; optional, default-inert `alternateHref` and `alternateLabel` support added to `src/components/public/graceful-screen.tsx`. Existing loading and error boundaries were reviewed and retained.

**Scoped improvements:** plain-language denial explains account/workspace context without revealing protected resource detail. Primary action opens the permission-aware `/dashboard`; secondary action opens `/login` for account change. Both links are fixed internal paths, noindex is preserved, and no retry or permission-changing control is offered on denied access. The shared component rejects non-local alternate URLs and otherwise leaves previous callers unchanged.

### UX-G085: request-demo contact — `/request-demo`

**Source:** `src/app/request-demo/{page,loading,error}.tsx`, `src/components/marketing/demo-contact-actions.tsx`. Existing marketing layout, structured metadata, description and full subject/body `mailto:` message remain intact. No backend lead form or new stored personal data is introduced.

**Scoped improvements:** the primary mailto CTA stays available, and users without an email client can copy the published contact address with one action. Success is announced through a polite live region; denied/missing Clipboard API yields actionable manual-copy instructions and leaves the address visible as a mailto link. Controls support keyboard/mobile interaction.

**Shared executable acceptance:** `tests/e2e/ux-public-recovery-groups.spec.ts` exercises desktop (1280×800), mobile (390×844), noindex/route navigation, keyboard focus, no horizontal overflow, maintenance offline/online transitions and safe retry with an intercepted dashboard destination, permission-denied recovery links, successful clipboard copy and denied-clipboard fallback. The dedicated `.github/workflows/ux-public-recovery-acceptance.yml` runs scoped ESLint and the seven Playwright scenarios. Full-project TypeScript validation remains an independent required check in `.github/workflows/ci.yml` and is not represented by this scoped browser acceptance. **Executed verification (2026-11-07):** [GitHub Actions run 42386318763](https://github.com/42Students/lms-vnext/actions/runs/42386318763) at exact source/test/workflow commit [`b8e9372eec9181a608ee5988f5d2d87b4845420c`](https://github.com/42Students/lms-vnext/commit/b8e9372eec9181a608ee5988f5d2d87b4845420c) **completed SUCCESS**. The job passed scoped ESLint, `npx playwright test tests/e2e/ux-public-recovery-groups.spec.ts --project=chromium --reporter=line` (**7/7 passing Chromium cases, no skips**), and `npm run typecheck` (`tsc --noEmit`, successful with Node 6 GiB heap). Desktop 1280×800 and mobile 390×844 passed for all three groups, plus the denied Clipboard API negative case. The normal `CI` workflow remains a separate release/quality gate; this focused proof makes no global release/security certification claim.

**UX group dispositions:** `UX-G068 DONE` (maintenance), `UX-G051 DONE` (forbidden), `UX-G085 DONE` (request-demo) in `docs/tracker.json#uxReview.groups`. Their use of fixed internal recovery paths does not grant additional permissions. Dashboard recovery uses a synthetic/stubbed destination for the maintenance test; the forbidden test follows the actual public `/login` recovery page and checks the workspace-link destination without requiring a test account. Demo clipboard success/error uses synthetic browser Clipboard API only; no emails sent, no real accounts accessed. These are scoped **UX** closures, not GR-80–83, parity, security, or release closure.

## UX-G185 and UX-G186 — Root/global crash recovery UX (7 November 2026)

**Ownership:** Both groups are claimed by `chat-ux-root-error-2026-11-07` in `docs/tracker.json#uxReview.groups`. These shared route states are scoped **UX polish**, not a claim that root failure, deployment, authorization, browser or release acceptance is globally certified.

### UX-G185 — App Router root error boundary (`src/app/error.tsx`)

The existing root route boundary still renders `GracefulErrorBoundary`, so it retains redacted browser event reporting, a locally generated support reference, one-time stale-chunk recovery, and explicit Try again, Go back and Home links.

The public 500 branch now labels its status heading and guidance for assistive technology, focuses that heading after an unexpected page replacement, and offers a **Copy reference** button. Copying uses only the locally generated 8-hex-character support code, never `error.message`, Next digests, route context, provider diagnostics or session information. If Clipboard API is denied, the reference stays selectable and users get an announced manual-copy instruction. The authenticated shell boundary is not changed by this root-only presentation branch.

**Acceptance scope:** a development-only test fixture at `src/app/e2e/ux-root-error-fixture/page.tsx` throws a synthetic exception when `NODE_ENV=development` **and** `UX_ROOT_ERROR_FIXTURE=1`. It cannot be enabled in a production build. Desktop/mobile Chromium verifies the actual root boundary, heading/focus, sanitized error text, safe navigation, reference copy/fallback, an intercepted redacted client-error report, and horizontal overflow; it never creates a real account or uses production data.

### UX-G186 — Global error document (`src/app/global-error.tsx`)

The global boundary handles cases where even the Next root layout fails. It still delegates its error to `GracefulErrorBoundary` rather than displaying the thrown message. It now supplies its own **accessible HTML document shell** (language, descriptive title, noindex/nofollow, viewport metadata) and static, self-contained emergency CSS. This makes the error instructions and controls usable when the normal app stylesheet/Inter font or root layout is unavailable. The CSS includes mobile padding and visible keyboard focus. It does not interpolate user or exception data.

**Acceptance scope:** Chromium loads a no-app-stylesheet preview containing the **exact CSS literal extracted from `global-error.tsx`**, at desktop/mobile sizes. It verifies visible headings, metadata, focusable controls, emergency layout and no horizontal overflow. This is a controlled CSS-failure preview, **not** a claim that a real production root-layout crash was induced. The shared Vitest checks document structure, redaction, one-time chunk recovery and fixture production guard. The true production layout-failure chaos drill remains a separate global release test.

**Executed UX acceptance (2026-11-07):** [GitHub Actions run 42392075010](https://github.com/42Students/lms-vnext/actions/runs/42392075010), exact tested commit [`ff4af9bbd86a7be0b7e07db1caab57468d421561`](https://github.com/42Students/lms-vnext/commit/ff4af9bbd86a7be0b7e07db1caab57468d421561), **SUCCESS**. Scoped ESLint **PASS**; `npx vitest run tests/unit/ux-root-global-errors.test.ts tests/unit/graceful-root-screens.test.ts --reporter=dot` **14/14 PASS**; `npx playwright test tests/e2e/ux-root-global-errors.spec.ts --project=chromium --reporter=line` **4/4 PASS** (root error and global stylesheet preview, each at desktop 1280×800 and mobile 390×844); `npm run typecheck` with a 6-GiB Node heap **PASS**. Synthetic test error content remained absent from the user-visible fallback; the test intercepted and checked sanitized client-error reporting. Root clipboard support reference copying passed in a real browser. Responsive, focus and emergency no-stylesheet checks passed. The old GR-14 test was realigned to the already-accepted access-denied UX wording; no existing permission was relaxed.

**Disposition:** `UX-G185 DONE` and `UX-G186 DONE` for the scoped UX pass, independently of full GR-11/GR-82 release and real-production layout-chaos acceptance. Global browser evidence is a **no-stylesheet preview**, not a claim of a production root-layout failure injection. All test-only exception triggering is disabled in production at source.



## UX-G075 — Public offline recovery (7 November 2026)

**UX-group allocation:** `docs/tracker.json#uxReview.groups[UX-G075]`. The route `/offline` was one of the 83 route-only entries missing from the older generated 2,080-surface registry; it is a **single standalone UX group**, not a DB/API/security parity closure.

**Source boundary:** `src/app/offline/page.tsx`, `src/app/offline/offline-recovery.tsx`; reuse existing `src/components/public/graceful-screen.tsx` without modifying the shared component. The root offline banner already suppresses duplicate notices on `/offline`. This group must not change session or tenant authorization.

**UX contract:**
- [x] Present a clear offline/reconnected state with understandable, role-neutral copy and an unambiguous retry CTA.
- [x] If the browser still reports offline, do not navigate, reload, or erase context; present an accessible inline recovery instruction.
- [x] On explicit retry while browser reports online, navigate to the **fixed same-origin** `/dashboard` destination so the existing role-aware landing handles authentication. Do not redirect automatically or accept user-controlled return URLs.
- [x] Preserve a separate `/login` fallback, noindex metadata and shared footer/legal links.
- [x] Keep the UI readable at mobile width, with keyboard-focusable controls and a polite live status announcement.

**Browser acceptance:** `tests/e2e/ux-offline-recovery.spec.ts` executes both 1280×800 and 390×844 with online/offline transitions, blocked offline retry, same-origin dashboard retry (mock destination; no real auth/PII), link/meta checks, focus and horizontal overflow checks.

**Executed UX verification (7 November 2026):** [GitHub Actions run 42384763728](https://github.com/42Students/lms-vnext/actions/runs/42384763728) at exact source/test/workflow SHA [`fc1c77b6f429751a5338b7437120a48d01854137`](https://github.com/42Students/lms-vnext/commit/fc1c77b6f429751a5338b7437120a48d01854137) **PASSED**. Scoped ESLint completed successfully. `npx playwright test tests/e2e/ux-offline-recovery.spec.ts --project=chromium --reporter=line` completed **2/2 passing**, with independently named desktop (1280×800) and mobile (390×844) browser scenarios. Each scenario verified visible recovery messages, blocked retry while offline, screen-reader live notice, focus, no horizontal overflow, canonical noindex/link attributes and navigation to a stubbed same-origin `/dashboard` only after reconnection. No real credentials, tenant data, or network mutation was used. The source-only differences did not touch the shared graceful-screen component or the already-present root offline-banner exception.

**UX-G075 disposition:** **DONE (scoped UX acceptance)**, separate from the independent global parity/security/release gates. New route-only inventory path `/offline` is accounted for; regenerate the global registry separately to reconcile all 83 newer pages without renumbering accepted group identities.

**Security regression boundary:** No auth/session/service/DB/storage code is changed. `navigator.onLine` is only a browser hint, not evidence that the backend is healthy. Retry is user-initiated, uses fixed `/dashboard` and is never an open redirect. Source-only implementation does not establish browser acceptance.

# Error surfaces

## Page: 404

**Implementation checkpoint (2026-10-13):** `src/app/not-found.tsx` supplies
public custom 404 copy and brand-matched Go back/Home actions without surfacing
internal route errors. Source-contract unit tests were authored.
Still requires desktop/mobile and authenticated-shell browser evidence before DONE.

- [ ] vNext custom/not-found experience decision recorded.
- [ ] authenticated pages preserve shell/helpful navigation where appropriate.
- [ ] public page does not expose internals.

## Page: 500 / fatal error

**Implementation checkpoint (2026-10-13):** `src/app/global-error.tsx`
provides the App Router root fatal boundary with required html/body, sanitized
public copy, a Retry callback, Go back and Home. App Router's authenticated
subtree retains its own error boundary. Error ingestion/session-preservation and
browser acceptance remain outstanding; source code is not closure evidence.

- [ ] fatal error experience decision recorded.
- [ ] retry/recovery path exists.
- [ ] errors are observable without leaking secrets.
- [ ] authenticated session is not destroyed unnecessarily.

# Test-only legacy route

## E2E Super Admin Login
Legacy `/e2e/superadmin-login` is a test helper.

- [x] Classified RETIRED as product UI.
- [ ] vNext E2E/auth harness covers equivalent deterministic test setup without a production backdoor.


## UX-NOTIF-01 — Shared Notifications inbox interaction group (2026-11-07)

**Group scope (registry snapshot, IDs may shift on regeneration):** `PAGE-0303` (`/notifications`); `ROUTE-STATE-0603/0604` (route error/loading); `WIDGET-0009/0010` (notification list and toolbar), with the shared `KIT-0006` confirmation component as an existing dependency. Also verify the role-specific notification-toolbar/list call sites after modifying their shared components. This UX group **does not replace** the outstanding W06 functional/security/parity evidence below.

**UX problems addressed in source:**
- The All/Unread and category links dropped the current search term, class and course filters. Shared filter-link builder now preserves validated values and intentionally resets historical pagination.
- Clear search discarded unrelated filters and ambiguous empty-state `All` links gave little guidance. Clear search now retains view/category/context; empty search states explain recovery, and the unfiltered escape action is explicit.
- Mark all as read affected the full inbox even with filtered results visible. The shared inbox now asks for confirmation and states the cross-filter effect.
- Category unread-count accessible labels previously called counts `in loaded view` although the reader counts the user's full relevant category. Labels now say `unread`.

**Edited files:** `src/app/(authenticated)/notifications/page.tsx`, `src/components/activity/notification-toolbar.tsx`, `src/components/activity/notification-list.tsx`, and pure URL helper `src/modules/activity/notification-filter-links.ts`. Regression cases are authored in `tests/unit/notification-filter-links.test.ts` (preservation, encoding, category reset, cursor reset, existing role paths, blank values). The existing route loading/error components were reviewed and retained; no authorization, database, mail, delivery or read-state mutation service was changed.

**Verification required for this group (separate from global W06 parity):**
- [ ] Focused Vitest suite, TypeScript and relevant lint pass on a recorded current main commit.
- [ ] Desktop and narrow-mobile browser checks for search → All/Unread → category → clear; history/back; empty/partial-error/retry; and older pagination links.
- [ ] Keyboard/screen-reader check of labels, notification detail open/close/focus, bulk-mark confirmation/cancel and post-success refresh.
- [ ] Shared-component regressions on Learner, Faculty, Mentor, TPO and Recruiter notification call sites; verify no scope/tenant/role behavior changed.
- [ ] Record actual screenshots/browser evidence and mark UX CLOSED only after all applicable checks have executed.

**Status:** `IMPLEMENTED / VERIFY` (code and tests authored, not certified as browser-accepted); no overall parity/security/release closure or denominator increment is claimed.

# Shared Notification Feed — W06 source-backed parity checkpoint (2026-10-10)

**Legacy oracle:** `lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2` TPO `src/pages/tpo/notifications.js`; legacy backend `lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`. The legacy TPO feed has All/Unread tabs, Mark all as read, Today/Yesterday/This week/Earlier buckets and a linked detail/open action.

**vNext W06 implementation authored:** `/notifications?view=all|unread` filters at the DB reader, counts the whole authenticated user's unread inbox (not merely the 100 rendered rows), `POST /api/notifications/read-all` acknowledges all unread rows atomically for the authenticated user's ID only, and the shared list groups by local India calendar day. 403 same-origin protection applies to writes. The legacy TPO-specific page remains W05-owned and may consume this shared contract; W06 does not edit TPO routes. The Learner-specific page stays W02-owned; the shared notification list component is reusable.

**Evidence still required before CLOSED:**
- [ ] Run focused Vitest date-bucket/unit tests and TypeScript/lint/build against the merged revision.
- [ ] Run DB10 PostgreSQL tests (105-row truncation, cross-user isolation, repeated/concurrent bulk acknowledgments) on disposable seeded PostgreSQL; confirm CI job executed.
- [ ] Browser test All/Unread deep links, mark-all state, keyboard/focus/accessibility, responsive desktop/mobile and error retry.
- [ ] Verify legacy TPO link-open automatically marks its row read; current shared list keeps an explicit Mark read action, so W05/this lane must agree on parity strategy.
- [ ] Execute browser/DB verification of keyset Older notifications pagination (50 per page; equal-time UUID ties, user-scoping, back-navigation). It was authored in W06 but is not yet VERIFIED. Import and producer coverage of announcements and legacy role-specific notifications remain open.
- [ ] Confirm all seven role-specific notification producer→consumer workflows; W02/W03/W04/W05 create domain event payloads, W06 owns shared inbox/outbox delivery, W01 owns identity/tenant primitives.

**State: PARTIAL (authored, tests not executed); no page or family verification status advanced.**


## W06 notification tenant-delivery privacy guard — additional open verification

**Legacy behavior review:** source-backed security improvement to prevent a platform producer from accidentally delivering college A event contents to unrelated college B recipients. Persisted active college membership, active recruiter/company relationship grants and Super Admin system roles are accepted for matching tenant scope; globally scoped events remain globally deliverable. The write rejects a mixed unauthorized recipient batch before insertion; user-supplied delivery recipient IDs are never treated as proof of tenant authorization.

- [ ] Execute the new `tests/integration/db10-notification-delivery-scope.test.ts` against seeded disposable PostgreSQL: both-college user, unrelated learner, mixed-batch atomic rejection and global-event delivery.
- [ ] Verify suspend/revoke/grant races with transactional producer tests and closed-grant negative cases before calling this release-safe.
- [ ] Verify recruiter notification types and all domain producers supply correct event scope and intended recipient grants; W05 owns CRM invitation and the TPO frontend.
- [ ] Review organization-scoped and platform-global event disclosure policy with W01/W05 and document any sanctioned cross-tenant broadcasts.

**This is a documented security tightening relative to the previously unaudited vNext fan-out. State remains PARTIAL / tests unrun.**


## W06 notification history and open-to-read — third authored batch

The shared `/notifications` feed now has recipient-only keyset pagination using `createdAt,id` rather than skipping records or losing older notifications at 100. Query params are validated; malformed half-cursors show an accessible reset state. Older links preserve All/Unread. The source-backed TPO behavior of opening a notification marking it read is implemented in shared `NotificationList` with a user-scoped write before navigation; failed acknowledgment is surfaced and still allows navigation.

- [ ] Execute `tests/unit/notification-cursor.test.ts` and `tests/integration/db10-notification-pagination.test.ts`; check cursor boundary, UUID tie, >100 records and cross-user isolation.
- [ ] Browser verify direct/back/forward refresh of older pages, unread count after read, mobile grouping and slow/failing mark-read navigation.
- [ ] Verify correct behavior when a notification is read or deleted while browsing historical pages; capture actual browser evidence before marking page CLOSED.

**Source authored only, runtime/browser proof pending.**


## W06 42 Tracker Super Admin triage staging — 2026-10-10

A migration-gated Super Admin triage slice is now source-authored at the legacy paths `/tracker/issues` and `/tracker/issues/[publicId]`: status/severity/environment/search/sort filters, stable keyset continuation, scoped issue detail, private engineering workflow editor, optimistic version conflicts, retest pass/fail, sanitized attachment metadata and immutable activity history. API routes are under `/api/tracker/issues/**`, require a current Super Admin server context, enforce selected Super Admin college/org scope, same-origin on mutations, and return **503 `DB10_TRACKER_MIGRATIONS_PENDING`** unless `DB10_TRACKER_READY=DB10_VERIFIED`.

Intentional privacy deviation remains: legacy unauthenticated issue list/detail is **not** reproduced. Public/reporting identity is still unresolved; reporter intake, screenshots, saved views, bulk actions, similar issues, logs and quick report remain OPEN. The UI explicitly renders Report issue and Logs as pending rather than fake links.

Authored evidence: `tests/unit/bug-tracker-admin-validation.test.ts`, `tests/db10-tracker-route-gates.test.mjs`, `tests/integration/db10-tracker-admin.test.ts`. **No TypeScript/Vitest/PostgreSQL/browser execution evidence in this session. DB10 draft tables remain unregistered; this slice is CODE_STAGED / MIGRATION_BLOCKED, not IMPLEMENTED or VERIFIED.**


## W06 Announcements shared-operations staging — 2026-10-10

Legacy `announcements` is now represented as a distinct DB10 draft model rather than being incorrectly treated as `in_app_notifications`. Source-authored code covers six audience types, explicit tenant scope, create/edit/retarget, schedule, expiry, pin, soft delete/restore and recipient visibility. Admin management pages are staged at `/college/announcements` and `/admin/announcements`; recipient read API is `GET /api/announcements/mine`. Every DB-backed route/page is migration-gated by `DB10_ANNOUNCEMENTS_READY=DB10_VERIFIED` and performs no table query while disabled.

**State: CODE_STAGED / MIGRATION_BLOCKED.** W01 must register/replay the table; W02 must place the recipient feed into Learner/Faculty owned notification surfaces. Tests are authored but unexecuted. No announcement parity row is VERIFIED.


## W06 scheduled-job distributed lease staging — 2026-10-10

A PostgreSQL-backed, fail-closed lease adapter is now source-authored for DB10 scheduled work, using database time, atomic expired-row takeover and monotonically increasing fencing tokens. It is **not active**: `scheduled_job_leases` remains an unregistered draft table and no user-facing scheduler has been rewired. Real concurrency tests are authored but unexecuted. External delivery exactly-once semantics remain OPEN until durable outbox/idempotency is implemented and each irreversible send validates current fence.


## W06 Admin audit detail/source reconciliation — 2026-10-10

All 13 legacy `admin_audit_log` fields are now source-reviewed against existing `activity_events`. W06 added tenant-safe event detail and bounded/redacted metadata rendering. Three legacy semantics remain actual persistence gaps: historical actor role/type snapshot, request IP and User-Agent. Actor mobile is an intentional privacy redesign (canonical actor read-time identity, no duplicated/rendered mobile). See `docs/planning/database-parity-db10-admin-audit.md`. DB10 verified field count remains 0; unit/PG/browser evidence is not executed.


## W06 external outbound delivery privacy contract — 2026-10-10

W05 requested recruiter invitation/reminder outbox transport with idempotency, suppression, bounces and zero raw-token logging. W06 staged `src/modules/operations/outbound-delivery-{contract,envelope,policy,queue}.ts` and isolated `src/db/schema/db10-outbound-messages.draft.ts`. Only a queued encrypted intent is modeled: **no provider acceptance, email/SMS send or recipient delivery is implemented**. Runtime queue fails closed until `DB10_OUTBOUND_READY=DB10_VERIFIED`, and W01 alone owns schema registration/migration. Source-backed evidence and detailed W05/W01 handoffs: `docs/planning/database-parity-db10-outbound.md`.

- [ ] W01 register schema + full replay on disposable PostgreSQL, verify queue idempotency/suppression/tenant checks and concurrency.
- [ ] Integrate provider template renderer/config, worker leases, durable send claims, provider-side idempotency and callback signature verification.
- [ ] Re-check active unsubscribe/Not Hiring/bounce/complaint suppression and invite validity immediately before dispatch; prove no race leaks.
- [ ] Verify role-scoped audit/log masking (no email, raw URL, invite token, decrypted variables in logs), cryptographic key rotation and retention.
- [ ] Run authored unit, static and integration tests, typecheck/lint/build, and live sandbox transport/browser tests.
- [ ] Complete unrelated legacy APP notification, digest, bulk-undo and template surfaces; staging only W05 invite/reminder is not full DB10 parity.

**Status: CODE_STAGED / PROVIDER_NOT_CONNECTED / MIGRATION_BLOCKED / TESTS_UNEXECUTED.**


## 2026-10-28 global-shell imported-interface checkpoint — source only

The wave-3 UI source graph identifies previously unexpanded shared descendants. Legacy FE pinned at `9d56bb7a347b06f242ef615c19fdc298f83329e0`; details: `docs/audit/legacy-dev-census/2026-10-28-wave3-source-reconciliation.md`. These are **acceptance checks within existing global notification, auth/shell, error and operations families**, not new project tasks or accepted parity rows.

- **Connectivity and retry:** legacy `src/components/Common/NetworkStatusBanner.jsx:L38-L68` renders offline and reconnected alerts, including alert/status semantics (`L42-L56`). A line-oriented JSX parser initially missed the multiline tag; the corrected wave-3-f record explicitly marks it UI. Trace `src/pages/_app.js` mounting and vNext global shell; then verify offline/online transitions, aria live behavior, permission-safe reconnect retry and mobile visibility. No equivalent vNext runtime implementation was certified by this pass.
- **Global notifications and responsive navigation:** legacy `src/components/Dropdowns/Notification/NotifivationDropdown.js`, `src/components/Notifications/NotificationsContent.jsx`, `src/components/Global/MobileMenuDrawer/MobileMenuDrawer.js` and `SuperAdminMobileMenuDrawer.js` are child UI. Inspect unread/view/read/deep-link behavior, role/tenant guards, focus/keyboard/Escape, mobile-only destinations and initial/failed/empty states.
- **System states and operations:** legacy `src/components/Common/PageShell.jsx`, `PanelStates.jsx`, `ErrorBoundary/JobsErrorBoundary.js`, `src/components/tracker/TrackerShell.jsx`, `AuditFindingDrawer.jsx` and `ClaudeReportModal.jsx` need route/provider reachability and accessible action/stale/error state verification, not speculative duplicates in the page count.

These source findings do not count as browser, API, PostgreSQL, UX or release proof. **No global/shared family was marked green.**

## UX-G004 — Activity Log and event detail (2026-11-07)

[Six-surface scope, source changes and exact-SHA browser acceptance ledger](pages/shared/UX-G004-activity.md). This UX group owns the shared Activity Log to event-detail journey, not the Notifications UX-G001 group or any DB/API/security parity gate. Canonical live status and ownership remain in `docs/tracker.json#uxReview.groups`; source edits and authored tests alone do not close browser or release acceptance.

## UX-G123 — Universities journey (7 November 2026)

**Scope:** `/universities` public marketing journey, loading and failure states, anchored sections and demo CTA. Group status in `docs/tracker.json#uxReview` is authoritative.

**Code implemented:** Route-local early demo link, accessible capabilities/journey shortcuts, deterministic section targets, removal of overlapping journey arrows, contextual loading skeleton and public safe-home error fallback. Existing shared marketing copy, SEO/canonical metadata, capability modules, privacy/auth, and request-demo workflow are untouched.

**Evidence required for closure:** `node --test tests/ux-universities-group.test.mjs`; `npx playwright test tests/e2e/ux-universities-journey.spec.ts --project=chromium` with 1280×800 desktop and 390×844 mobile screenshots; `npm run typecheck`; `npm run ux:guard`; marketing links/CTA regression; explicit no private role or API contract change review.

**State:** **UX-G123 DONE (scoped acceptance), 7 November 2026.** Source SHA: `835e21ff8b1b4b82b15e1edae82a872e9d7fae6e`.

**Executed evidence:** [GitHub Actions UX-G123 run](https://github.com/42Students/lms-vnext/actions/runs/42386799736) — scoped ESLint and 3/3 Node source contracts passed; desktop (1280×800) and mobile (390×844) Playwright each passed, including focus, anchor shortcuts, actual `/request-demo` navigation, no overflow or page errors. [Artifact containing both viewport screenshots](https://github.com/42Students/lms-vnext/actions/runs/42386799736/artifacts/13579304583) — desktop.png and mobile.png (730,066 uploaded bytes). `npm run typecheck` passed in the same run.

**Global guard caveat (not attributed to UX-G123):** `npm run ux:guard` reported two `unverified-touch-class` violations on concurrently owned `src/app/campaign-unsubscribe/[token]/page.tsx:19` and `src/app/college-join/[token]/loading.tsx:6`; **zero violations under `src/app/universities/`**. The workflow is red due to those unrelated changes, so no repository-wide green CI claim is made.

**Regression/security review:** Only Universities route-local page/error/loading files changed. Shared marketing shell, canonical metadata, seven truthful capability modules, /request-demo handler, API contracts, all tenant/auth/RLS checks and cross-role workflows remain unchanged. Both browser tests followed the real public demo path; error fallback stays public (/), never an authenticated dashboard.


## UX-G076 — Public placements and retired shared-job links (7 November 2026)

**Canonical group:** docs/tracker.json UX-G076. Scope: /placements and
/placements/jobs/[jobId], including route-level error, loading and not-found.
This scoped UX work does not advance DB/API/security/release certification.

**Source revisions:** [implementation commit](https://github.com/42Students/lms-vnext/commit/dee9805696652c9c8fafacd6ae016970d2acb72a),
[SSR/browser contract](https://github.com/42Students/lms-vnext/commit/095be6e0cb5377f4ddd877a3d1f1f5fa53d88306),
and [disposable published-college acceptance fixture](https://github.com/42Students/lms-vnext/commit/5ef5b1e3a6a9eadac89ffabb4744cda56aeb5e0f).

**UX and privacy changes:** The published page has responsive overview,
outcome cards, suppression-aware empty states, clear 12-month live-aggregate
basis and separate snapshot freshness warning, and a preserved recruiter
contact surface. Anonymous access still depends on a verified current college
host and explicitly published aggregate rows; individual learner, applicant,
employer and placement details remain private. Unknown/unpublished tenant hosts
are given an anonymous 404 presentation; a temporary domain-directory outage
is retryable rather than misclassified as unpublished. Route loading and
errors have accessible messages, mobile-friendly retry and safe-home controls.
Retired job URLs are noindex, expose no individual job, applicant or employer
records, and have safe workspace sign-in/public-information links. Existing
work-email OTP and publication/proxy readiness gates remain unchanged.

**Exact-SHA execution:** [UX-G076 Actions run 42386887182](https://github.com/42Students/lms-vnext/actions/runs/42386887182)
at source SHA 5ef5b1e3a6a9eadac89ffabb4744cda56aeb5e0f.
The published-college job passed disposable PostgreSQL 17 e2e preparation,
synthetic verified host and publication seed, and Chromium 2/2 actual-page
desktop 1280x800/mobile 390x844 browser cases. Those cases asserted that
publicly approved metrics, college description, recruiter section and privacy
copy appeared, while private learner data and unapproved metrics did not;
both viewports had no horizontal overflow or uncaught browser errors.
Synthetic records and host routing were local to the test job; there was
no live provider, credential or production-tenant access.

**Separate focused job:** exact run 42386887182 also checks scoped lint,
full TypeScript, server-rendered/negative disclosure tests and two-viewport
retired-link and anonymous page navigation. Do not mark this group DONE until
that job has a successful conclusion; the earlier failing run
[42386249758](https://github.com/42Students/lms-vnext/actions/runs/42386249758)
had 2/4 browser passes due to an incorrect HTTP-404 assertion on streaming
Next.js output. The revised test asserts the rendered non-disclosure state
instead of the potentially already streamed HTTP response status.

**Cross-role and security boundary:** No role/RLS/membership checks, private
placement authorization or shared kit code changed; neither this source
implementation nor seeded browser fixtures constitute public-enquiry provider,
independent security, deployment, functional parity or release proof.


**Final UX-G076 verification (7 November 2026):** The same exact-SHA
[Actions run 42386887182](https://github.com/42Students/lms-vnext/actions/runs/42386887182)
has completed **SUCCESS** for both jobs. Scoped ESLint and repository TypeScript
checks passed. Three Vitest files passed **17/17** server-render, guard,
unpublished, outage, stale-snapshot and disclosure checks; anonymous
not-found and private retired-job-link Chromium desktop/mobile tests passed
**4/4**. The independent disposable PG17 verified-college published
desktop/mobile browser job passed **2/2**. Evidence is source and execution
SHA 5ef5b1e3a6a9eadac89ffabb4744cda56aeb5e0f, browser matrices
1280x800 and 390x844. The prior pending-workflow instruction above is
superseded by this completed record. Canonical group status is **DONE**,
committed in [tracker closure 99e72758d74eb56aaedd070bb0bf856bfa729898](https://github.com/42Students/lms-vnext/commit/99e72758d74eb56aaedd070bb0bf856bfa729898);
this is only scoped UX closure, not deployment, security, or role-parity sign-off.

## Public page: College recruiter join — UX-G045

**Scope / source:** `/college-join/[token]` page, loading and route-level error, and the shared recruiter invitation form. The college-only token lookup and readiness guard remain in `src/app/college-join/[token]/page.tsx`. A transient preview outage renders a retry rather than a false expired link. Invalid/expired/revoked links never display a live verification form and do not probe provider readiness. The existing `GracefulErrorBoundary` continues to own fatal error fallback.

**UX changes:** The work-email verification stage now has `Change work email`. Correction retains the recruiter's name and optional contact data but clears old code, confirmed recipient, stale company lookup and field errors; it is disabled during in-flight work. Code focus happens after mount and again on a successful resend, rather than racing the render. Invalid invitation and blocked verification offer sign-in recovery. Public action hit areas explicitly stay at least 44px at both mobile and desktop widths despite the global 36px desktop button-height CSS. Loading skeleton shares the actual form width, its progress is announced, and decorative shimmer respects reduced motion.

**Executed browser and unit evidence (2026-11-07):** [UX-G045 scoped workflow run 42387237926](https://github.com/42Students/lms-vnext/actions/runs/42387237926) on exact implementation SHA `98de5b5cc549513337e9a1ed04343f65933ffccb`: scoped ESLint success, Vitest 17/17 across three source/SSR regression suites, Playwright Chromium 4/4 across 375x800 and 1280x800, zero failing runs; HTML report and test-attached screenshots stored in [artifact 13579374692](https://github.com/42Students/lms-vnext/actions/runs/42387237926/artifacts/13579374692). Browser cases cover real invalid-token route, sign-in navigation, minimum recovery target, overflow, mocked READY flow email validation, OTP focus, mistaken address correction and company reset, resend, incorrect-code refusal and successful join UI. Browser network requests in READY fixture are deliberately mocked, not live OTP traffic.

**Regression/security review:** Shared form's COMPANY/college endpoint selection, token format, server-side scope/readiness checks, email validation, six-digit code guard, pending submission protection, error-state copy and sign-in route are retained. `src/app/e2e/ux-g045-college-join/page.tsx` mounts the genuine form with synthetic data only in development; it calls `notFound()` outside `NODE_ENV=development`. No API route, DB schema, RLS, role permission, invitation bearer token storage or provider configuration was changed. Invalid-token production route was exercised in Chromium; positive flow uses fully intercepted test requests.

**Boundary / remaining global gates:** This UX group cannot certify provider delivery, live invitation issuance/acceptance, real database persistence, production tenant authorization or full release readiness; those remain in separate DB/API/security and parity gates. Final exact-SHA TypeScript-gated acceptance: [run 42387417330](https://github.com/42Students/lms-vnext/actions/runs/42387417330) on `3fb85a0bf15636e52172589ccb4a82ce12a9cd56` passed scoped ESLint, TypeScript, Vitest 17/17 and Chromium 4/4. Browser screenshot/HTML evidence is retained as [artifact 13580351772](https://github.com/42Students/lms-vnext/actions/runs/42387417330/artifacts/13580351772). **UX-G045 closed in the UX ledger; independent live-provider/DB/auth and production release gates are not closed.**

## UX-G050 / UX-G052 / UX-G077 — Public marketing journeys (7 November 2026)

**Canonical allocation:** `docs/tracker.json#uxReview`; three separately claimed groups owned by `ux-marketing-trio-2026-11-07`.

**Implemented:** Early accessible wayfinding and CTAs on Enterprises (`/enterprises`), Home (`/home`) and Platform (`/platform`); safe in-page anchors; responsive numbered platform lifecycle; public error fallback and contextual slow-loading states; canonical/OG/Twitter metadata on Platform. No shared marketing shell changes or altered permissions, product availability, tenant data, workflows, API contracts or sensitive outputs.

**Exact source acceptance SHA:** `38fa70d71d4b282b73f18d32b7e2b21c1be61bfe`. [Scoped GitHub Actions execution](https://github.com/42Students/lms-vnext/actions/runs/42390390665) completed ESLint, `node --test tests/ux-marketing-trio-group.test.mjs`, and `npx playwright test tests/e2e/ux-marketing-trio.spec.ts --project=chromium --reporter=line` successfully. Desktop 1280×800 and mobile 390×844 checks cover keyboard/focus, live internal navigation, responsive width, runtime errors, and actual CTA destinations: Home→Universities, Enterprises/Platform→Request a Demo.

**Visual proof:** [Retained artifact](https://github.com/42Students/lms-vnext/actions/runs/42390390665/artifacts/13580969005) contains `home-desktop.png`, `home-mobile.png`, `enterprises-desktop.png`, `enterprises-mobile.png`, `platform-desktop.png`, and `platform-mobile.png` in `ux-marketing-trio-evidence/`.

**Cross-role/security regression:** Route-local pages only; no auth, role, RLS, tenant, server-side API, PII, or storage logic changed. Existing shared `MarketingLayout` and /request-demo flow preserved. Human-operated learning/placements descriptions and the enterprise outcomes disclaimer remain; unbuilt AI and third-party integrations are not advertised. Group-level browser tests exercise real public destinations, not mocked success.

**Release boundary:** Source/browser scoped acceptance is evidence for each route group, **not** a claim that every repository-wide security, UX guard, CI, deployment, or cross-role workflow is green. The workflow's separately recorded global TypeScript result remains authoritative; record failures without weakening gate assertions.

## UX-G002 — Root sign-in and authenticated workspace recovery (2026-11-07)

[UX-G002 root journey scope, fix, and exact-SHA acceptance](pages/shared/UX-G002-root.md). The shared root sign-in continues to honor validated return paths and tenant policy; the platform marketing redirect now excludes legacy Super Admin OTP requests. UX group status lives only in `docs/tracker.json#uxReview.groups`.


## UX-G078 — Canonical privacy policy usability (7 November 2026)

Canonical UX group: UX-G078 in docs/tracker.json. Source: src/app/privacy-policy/page.tsx,
public/assets/static/privacy-policy-view.html (reviewed, not altered), and route
loading/error boundaries. This is not legal-content approval or privacy/release certification.

The canonical indexed /privacy-policy page continues to render the complete
trusted checked-in Android/web policy without redirecting to an asset URL.
All 13 existing section anchors and legal statements/effective date are intact.
Enhancements: keyboard skip link, visible scoped focus treatment, 44px minimum
section navigation targets, single-column mobile links, scroll target offset,
and print-friendly styling. Canonical metadata and privacy contact are preserved.

Source and SSR regression: tests/unit/UX-G078-policy-render.test.tsx; old
policy-render assertions remain in tests/unit/UX-chat16-public-auth-legacy-bookmarks-03.test.ts
and UX-public-legacy-redirects-02.test.ts. Browser test
tests/e2e/ux-g078-g089-public-routes.spec.ts covers desktop 1280x800 and
mobile 390x844 keyboard navigation, section anchors, canonical/contact, no
overflow or uncaught errors.

The historical mixed public-UX source file tests/ux-public-second-half.test.mjs
had 2 passes and 9 failures at the first attempt, on unrelated other
marketing/root, forbidden, request-demo, company-share and shared marketing
surfaces. The privacy case passed. Those failures have NOT been removed,
weakened, or counted as green: the scoped acceptance uses only the named
policy case, independent SSR/negative checks and actual browser journeys.
The broader red mixed suite remains a separate cross-group obligation.

Initial source commit:
https://github.com/42Students/lms-vnext/commit/e3c0d95216dea31859a1ce5c2fa7e796672de6c3
First acceptance run:
https://github.com/42Students/lms-vnext/actions/runs/42390560149
(Scoped ESLint and TypeScript, plus 4 Vitest files/13 unit tests PASS;
unrelated mixed-suite negatives caused the job to stop before browser.)
Revised exact-SHA verification:
https://github.com/42Students/lms-vnext/actions/runs/42390895781
at source SHA 670881e5be5e1091f76ee59156fd1c4eb0ad108b.
Do not mark DONE until final successful browser/SSR evidence is recorded.

## UX-G089 — Retired Super Admin sign-in bookmark usability (7 November 2026)

Canonical UX group: UX-G089 in docs/tracker.json, route /superadmin-login
and its loading/error. The alias remains a direct safe redirect to the existing
first-party OTP entry /login?legacy=superadmin. It cannot mint a session,
grant a role, bypass server role checks or trust foreign return hosts.
The alias has noindex/nofollow metadata. Its route-local error screen
hides exception details, provides Try again and a fixed secure sign-in link;
loading copy explains the secure sign-in transition. Minimum 44px actions
and responsive wrapping support mobile and keyboard use.

The existing actual redirect unit test remains. New focused source tests in
tests/unit/UX-G089-superadmin-bookmark.test.ts and actual browser test in
tests/e2e/ux-g078-g089-public-routes.spec.ts verify the fixed safe redirect,
absence of privileged-session shortcuts, accessible recovery, correct OTP
login context at desktop/mobile and no horizontal overflow.
No real OTP, credential, role fixture or production tenant data is used.

Exact-SHA run is shared with UX-G078:
https://github.com/42Students/lms-vnext/actions/runs/42390895781
at 670881e5be5e1091f76ee59156fd1c4eb0ad108b.
The independent authorization, security and release gates remain open.


**UX-G078/G089 exact-SHA final acceptance (7 November 2026):**
[Actions run 42391328381](https://github.com/42Students/lms-vnext/actions/runs/42391328381)
on source/test/workflow SHA 102c0927b982a07f1dcec27c2ed40eefb5e9d24b
completed SUCCESS. Scoped ESLint and full repository TypeScript passed;
four Vitest files / **13 of 13 tests passed**; the existing mixed file's
named privacy test passed **1/1**; Chromium policy and safe sign-in browser
journeys passed **4 of 4** (desktop 1280x800, mobile 390x844). Both groups'
canonical UX status may be changed to DONE under their scope, independently
of the still-red historical 9 mixed-suite assertions, seven-account parity,
tenant/role security controls and production release acceptance.

Earlier browser failures in [run 42390895781](https://github.com/42Students/lms-vnext/actions/runs/42390895781)
were **test-only**: title expectation missed the shared Next.js suffix,
and a Privacy Policy query matched both the sign-in form and footer links.
They were corrected to accept the correct template title and target the
footer navigation. The application data, OTP, permission and legal-content
behavior was not changed to satisfy those assertions.


## UX-G003 and UX-G067 — Signed-in devices and dedicated login recovery (2026-11-07)

- [UX-G003 session-management UX](pages/shared/UX-G003-devices.md): truthful device-load states, real refresh, and first-party seeded session browser coverage, without changing authorization or revocation APIs.
- [UX-G067 direct /login UX](pages/shared/UX-G067-login.md): non-indexed credential entry, direct fresh-sign-in error action and named loading feedback.

Closure is governed by `docs/tracker.json#uxReview.groups` and the scoped exact-SHA acceptance workflow.

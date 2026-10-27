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

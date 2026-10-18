# chat-16 HR messaging, email, campaign, inbound mail and public/auth coverage ledger

Updated 2026-10-18; source branch `chatgpt/chat-16-b`. This is an **in-progress behavioural coverage ledger**, not a release certificate. Each covered row names an actual source export or route and a test that invokes it (unless specifically marked source-contract). Authored tests have not been run in this GitHub-only session. A failing/unrun test is **not** treated as verified coverage.

## Export / route ledger: direct behavioural tests

| Source file or route | Exported function / page | Behaviour exercised | Test file |
|---|---|---|---|
| `src/modules/placements/recruiter-message-email-model.ts` | `recruiterReplyTokenForThread` | Invalid UUID, secret length, deterministic per-thread HMAC | `tests/unit/chat16-email-bridge-hardening-02.test.ts` |
| same | `makeRecruiterReplyAddress`, `isRecruiterReplyAddress` | Host validation, malformed DNS labels, excessive lengths, foreign Reply-To | `tests/unit/chat16-email-bridge-hardening-02.test.ts` |
| same | `recruiterMailBridgeSignature`, `verifyRecruiterMailBridgeSignature` | Signed exact bytes, tamper, short secret, invalid signature | `tests/unit/chat16-email-bridge-hardening-02.test.ts` |
| same | `extractRecruiterEmailReply` | Reply-only extraction, quoted history, forwarded delimiters, blank and oversized body | `tests/unit/chat16-email-bridge-hardening-02.test.ts` |
| same | `safeRecruiterEmailMergeText`, `safeRecruiterDigestMessages` | HTML escaping and hard size bound, last three messages | `tests/unit/chat16-email-bridge-hardening-02.test.ts` |
| same | `isRecruiterUnreadReminderDue` | Quiet interval, minimum first-unread delay, six-hour resend cooldown | `tests/unit/chat16-email-bridge-hardening-02.test.ts` |
| `src/modules/placements/hr-recruiter-bell-model.ts` | `relativeHrBellTime` | Relative-time display with explicit time | `tests/unit/chat16-round3-two-unit-regressions.test.ts` |
| same | `createHrBellMutationGate` | Same-tick duplicate suppression, failure recovery, instance independence | `tests/unit/chat16-hr-bell-double-submit-03.test.ts` |
| `src/modules/placements/hr-conversation-inbox-service.ts` | `listHrConversations` | Expired session, wrong role, wrong tenant, stale selection, malformed input, tainted upstream rows | `tests/unit/chat16-hr-account-journeys-04.test.ts` |
| `src/modules/placements/hr-conversation-inbox-model.ts` | `hrConversationQuerySchema`, `filterRecruiterConversations`, `onlyUnreadRecruiterThreads`, `orderRecruiterConversations`, `scopeRecruiterConversations`, `countScopedConversations`, `hrConversationPageBounds` | Schema constraints, job authorization, empty state, stable ordering, unread filtering, pagination | `tests/unit/chat16-hr-conversations-edge-02.test.ts` |
| `src/modules/placements/hr-conversation-snippet-model.ts` | `conversationSnippet` | Whitespace, negative/large bounds | `tests/unit/chat16-hr-conversations-edge-02.test.ts` |
| `src/modules/placements/hr-conversation-detail-pagination-model.ts` | `hrConversationDetailPageWindow` | Invalid page and stale tab clamping | `tests/unit/chat16-hr-conversations-edge-02.test.ts` |
| `src/modules/placements/hr-conversation-detail-links-model.ts` | `hrConversationDetailHref` | UUID and safe path validation | `tests/unit/chat16-hr-conversations-edge-02.test.ts` |
| `src/modules/placements/hr-conversation-urls-model.ts` | `hrConversationsHref` | Query-string construction | `tests/unit/chat16-hr-conversations-edge-02.test.ts` |
| `src/modules/placements/hr-conversation-return-url-model.ts` | `recruiterInboxReturnUrl` | No foreign origin or open redirect | `tests/unit/chat16-hr-conversations-edge-02.test.ts` |
| `src/modules/placements/hr-conversation-send-feedback-model.ts` | `hrReplySuccess`, `hrReplyErrorMessage` | Deny false success, safe 400/403/500 copy | `tests/unit/chat16-hr-conversations-edge-02.test.ts` |
| `src/modules/placements/hr-conversation-open-model.ts` | `hrOpenRecruiterConversationSchema` | Reject role injection and malformed identifiers | `tests/unit/chat16-hr-conversations-edge-02.test.ts` |
| `src/modules/placements/hr-notifications-model.ts` | `hrNotificationsQuerySchema`, `hrInboxPageBounds`, `projectHrNotifications`, `filterHrNotificationJobs` | Wrong job, unknown event type, page limits, search normalization | `tests/unit/chat16-hr-notifications-privacy-02.test.ts` |
| `src/modules/placements/hr-conversation-reply-model.ts` | `hrRecruiterReplySchema` | Empty, extra fields and 4001-character reply denial | `tests/unit/chat16-hr-notifications-privacy-02.test.ts` |
| `src/modules/messaging/runtime-safety.ts` | `canContactRecipientAtRuntime` | Fail-closed nonproduction allowlist and invalid address | `tests/unit/chat16-messaging-policy-02.test.ts` |
| `src/modules/messaging/allowlist.ts` | `parseAuthTestAllowlist` | Case normalization, duplicates, invalid recipients | `tests/unit/chat16-messaging-policy-02.test.ts` |
| `src/modules/messaging/batch-dedupe.ts` | `dedupeBatch`, `opaqueBatchAttemptKey` | Duplicate sends and ambiguous key prevention | `tests/unit/chat16-messaging-policy-02.test.ts` |
| `src/modules/messaging/model.ts` | `outboundSendSchema`, `normalizeRecipient`, `isValidRecipient`, `decideDelivery`, `previewAudience` | Invalid inputs, suppression, caps, deduplication and purpose boundaries | `tests/unit/chat16-messaging-policy-02.test.ts` |
| `src/modules/messaging/audience-summary.ts` | `summarizeAudience` | Accurate eligible/suppressed counts | `tests/unit/chat16-messaging-policy-02.test.ts` |
| `src/modules/messaging/provider-acceptance-model.ts` | `isExotelAcceptedResponse` | Deny false-positive HTTP/provider statuses | `tests/unit/chat16-messaging-policy-02.test.ts` |
| `src/modules/messaging/receipt-history-window-model.ts` | `messagingHistoryPageWindow` | Out-of-range page caps | `tests/unit/chat16-messaging-policy-02.test.ts` |
| `src/modules/messaging/receipt-history-model.ts` | `projectMessagingHistory` | Provider acceptance vs delivery truthfulness | `tests/unit/chat16-messaging-policy-02.test.ts` |
| `src/modules/messaging/receipt-history-export-model.ts` | `messagingHistoryCsv` | CSV escape, hidden-whitespace formula injection, aggregate-only output | `tests/unit/chat16-messaging-csv-formula-03.test.ts` |
| `src/modules/messaging/tpo-campaign-send-policy.ts` | `campaignRecipientDisposition`, `assertCampaignRecipientCap`, `planTpoCampaignRecipients` | Opt-out, bounce, campaign cap, unique eligible contacts | `tests/unit/chat16-tpo-campaign-hardening-02.test.ts` |
| `src/modules/messaging/tpo-campaign-recipient-token.ts` | `issueTpoCampaignRecipientToken`, `verifyTpoCampaignRecipientToken`, `matchesCampaignRecipient`, `campaignUnsubscribeDecision` | HMAC tampering, college/recipient mismatch, idempotent opt-out | `tests/unit/chat16-tpo-campaign-hardening-02.test.ts` |
| `src/modules/messaging/tpo-campaign-draft-model.ts` | `previewTpoCampaignText`, `tpoCampaignDraftSchema` | Copy limits, duplicate lead IDs, unknown fields | `tests/unit/chat16-tpo-campaign-hardening-02.test.ts` |
| `src/modules/inbound-mail/message-model.ts` | `safeInboundPreview`, `inboundMailListQuerySchema`, `inboundMailMetadataSchema` | Control sanitization, page and search cap, metadata validation | `tests/unit/chat16-inbound-mail-security-02.test.ts` |
| `src/modules/inbound-mail/drawer-model.ts` | `safeMailDrawerText`, `inboundMailDetailSchema` | NUL removal, body caps, status parsing | `tests/unit/chat16-inbound-mail-security-02.test.ts` |
| `src/modules/inbound-mail/admin-service.ts` | `listInboundMailForAdmin` | Global role, absent DB table, normalized recipient | `tests/unit/inbound-mail-admin-service.test.ts` (listed in rolling failures; not green) |
| `/e2e/superadmin-login` | `LegacySuperAdminE2ELoginPage` | Privileged e2e alias cannot bypass real auth | `tests/unit/UX-chat16-public-auth-legacy-bookmarks-03.test.ts` |
| `/privacy-policy` | `PrivacyPolicyPage` | Stable static policy destination, no auth requirement | `tests/unit/UX-chat16-public-auth-legacy-bookmarks-03.test.ts` |
| `/college-admin/departments` | `LegacyCollegeAdminDepartments` | Active vs suspended, wrong roles, removed membership | `tests/unit/UX-chat16-public-auth-legacy-bookmarks-03.test.ts` |
| `/college-admin/programs` | `LegacyCollegeAdminPrograms` | Active vs suspended, wrong roles, removed membership | `tests/unit/UX-chat16-public-auth-legacy-bookmarks-03.test.ts` |

## Additional source-contract tests (not counted as full behavioural integration)

| Code boundary | Current source-contract test | Missing verification |
|---|---|---|
| Recruiter digest worker and authenticated inbound webhook | `tests/unit/chat16-email-bridge-hardening-02.test.ts` | PostgreSQL locks, replay and rollback; provider requests; cross-college grants |
| HR notifications service and read receipt service | `tests/unit/chat16-hr-notifications-privacy-02.test.ts` | Read/write transaction races and real-DB role matrix |
| Global inbound triage mutation | `tests/unit/chat16-inbound-mail-security-02.test.ts` | PostgreSQL optimistic version conflict and role matrix |
| Public homepage/login, retired handoff and invitation aliases | `tests/unit/chat16-public-auth-role-journeys-02.test.ts` | Browser render, focus, responsive states, real session expiry |
| College Feature Controls SA policy editor | `tests/unit/chat16-final-sa-tenants-modules-25.test.ts` | Real back-end recheck, stale concurrent mutation and consent |

## Remaining validation and exhaustive-coverage work (explicitly OPEN)

- Direct behavioural suites have since been authored for provider adapters, campaign dispatch and consent rechecks, recipient HMAC persistence, opt-out and notification writes, TPO/HR inbox access, signed inbound recruiter email replies, and inbox triage. The earlier inventory above predates these additions; details and test filenames appear in the later dated entries below. **No aggregate branch-coverage percentage is claimed.**
- Public/auth page-level suites now cover login/session recovery, recruiter invitations and joins, public unsubscribe/confirmation, company share, public placement disclosures, platform/universities/enterprises, root error/loading/not-found, and health/readiness, but browser focus/responsiveness, provider backends and end-to-end workflows remain unverified.
- Full PostgreSQL concurrency and transaction acceptance, signer/provider webhook integration, real SMTP/SMS delivery and the latest cloud CI run remain **OPEN**. The current private provider credentials, production SMS DLT confirmation and browser environment are outside what this GitHub-only lane can validate; never interpret a mocked service or authored SSR suite as a live acceptance pass.

## Additional direct test inventory — 2026-10-18

| Boundary | New direct test cases | Evidence |
|---|---|---|
| Campaign template boundary | `messaging-template-boundary-16`: authentication-template exclusion, bad keys and valid campaign keys | `tests/unit/chat16-messaging-uncovered-pure-models-16.test.ts` |
| Campaign source and filters | `messaging-campaign-source-16`, `messaging-campaign-filter-16`: strict query inputs, cardinality limits, URL-safe destinations | same |
| Engage audience preview | `messaging-engage-preview-16`: segment selection, suppression precedence, no contact PII in returned counts | same |
| Campaign history copy and opt-out timeline | `messaging-history-copy-16`, `messaging-unsubscribe-event-16`: IST display, safe fallback and existing legacy notification text | same |
| Signed messaging unsubscribe | `messaging-unsubscribe-token-16`: canonical signature, tamper, expiry and no GET-side mutation | same |
| Public marketing and recovery pages | `UX-chat16-public-home-01`, `UX-chat16-public-universities-02`, `UX-chat16-public-enterprises-03`, `UX-chat16-public-demo-04`, `UX-chat16-forbidden-05`: server-rendered HTML, navigation, CTA and safe forbidden recovery | `tests/unit/chat16-public-marketing-forbidden-pages-16.test.tsx` |

These are newly authored cases, **not an executed green run**. Provider, database concurrency, invitation acceptance and session-expiry browser coverage remain explicit external verification gates. The historical two chat-16 failures named by `unit-failures-latest.md` were independently reconciled against the main-branch gap register; their original 32-ID assertions and status ownership checks were retained unchanged. The typecheck report named no chat-16 errors.

### Sign-in route execution probes (new)

`tests/unit/chat16-public-auth-real-pages-16.test.tsx` imports and invokes both the real `/` page and the `/login` alias rather than only inspecting source strings. Cases `UX-chat16-auth-platform-01` through `UX-chat16-auth-metadata-05` check anonymous marketing redirect, reachable sign-in, college-host branding/channel restriction, unknown-host fail-closed recovery, active-session same-origin return redirect and tenant-scoped page metadata. Network/DB collaborators are mocked; this is a unit-level route probe, not a real browser/session test.

### Recruiter unsubscribe notification defect closure

The in-app opt-out event now replaces control characters, collapses whitespace and truncates untrusted CRM display names at 120 characters before constructing the existing legacy wording. `messaging-unsubscribe-event-16` additionally covers newline, tab and overlong names. This does not change normal legacy notification text. Vitest, typecheck and runtime consumer tests remain to be run in cloud CI.

### Direct TPO messaging receipt-history service tests

`tests/unit/chat16-messaging-receipt-history-service-16.test.ts` now invokes `listTpoMessagingHistory` and `exportTpoMessagingHistory` directly with an isolated mocked query builder. The four cases `messaging-receipt-history-16`–`19` enforce role and active-membership denials before any database access; strict bounded query filters; persisted-actor authorization before reading aggregate receipt counts; safe count pagination and honest `acceptedByProvider` semantics; and revoked-grant refusal. Transaction mocks are not equivalent to database race verification. Both services still need actual PostgreSQL tenant and concurrency acceptance; authored code remains unexecuted in this lane.

### Admin inbound-mail page and CAS write coverage

`tests/unit/chat16-inbound-mail-admin-page-16.test.tsx` directly invokes `src/app/(authenticated)/admin/inbound-mail/page.tsx`. The cases `UX-chat16-inbound-mail-01`–`04` cover permission checks, malformed search/filter recovery before mailbox reads, storage-unavailable status versus empty results, canonical recipient filtering and bounded private list data.

`tests/unit/chat16-inbound-mail-admin-versioning-16.test.ts` invokes `changeInboundMailStatusForAdmin` and validates Super Admin global-only access, schema rejection before writes, absent storage not presented as success, optimistic version/status stale outcomes and confirmed persisted values. These are injected-repository and mocked-query tests, **not** real PostgreSQL concurrent-transaction verification. No provider integrations were run.

### Inbound status HTTP route checks

`tests/unit/chat16-inbound-mail-status-route-16.test.ts` invokes the actual `PATCH /api/admin/inbound-mail/status` route. Cases `inbound-mail-route-16`–`20` check same-origin denial before session lookup, 409 on stale compare-and-swap, 503 when the backing table is absent, success with `private, no-store`, and the shared error handler preventing credential/error-detail exposure. The session, same-origin and persistence boundaries are individually mocked in this suite; full Postgres concurrency and browser testing remain outstanding. No test here makes a real outbound provider call.

### Campaign draft history/detail persisted-grant defect and regression

`src/modules/messaging/tpo-campaign-draft-service.ts` previously checked the request-context TPO role on `listTpoCampaignDrafts` and `getTpoCampaignDraft`, but unlike draft creation and recipient-status reads, did not check persisted actor permissions inside the read transaction. Those two reads now call `assertPersistedPlatformPermission(tx, context, "placements.manage", {organizationId, collegeId})` **before** executing a scoped query. This prevents a stale session with a revoked database grant from continuing to read campaign titles, subject lines or bodies. `tests/unit/chat16-tpo-campaign-draft-live-role-16.test.ts` covers `campaign-draft-read-16`–`19`: inactive or wrong role, current persisted permission, revocation before a query and invalid ID denial. Real PostgreSQL revocation/race and CI remain pending.

### New outbound execution and provider-adapter tests (chat-16)

- `tests/unit/chat16-outbound-batch-service-16.test.ts`: `messaging-batch-execution-01`–`07` directly execute `deliverBatch` and `validOutboundBatchId` with in-memory repository/provider fakes, asserting full-batch validation before side effects, opaque recipient-key records, live opt-out rechecks, policy fetch failure recovery, cumulative per-recipient caps, case-insensitive deduplication and nonproduction allowlisting.
- `tests/unit/chat16-outbound-provider-adapters-16.test.ts`: `messaging-provider-16`–`22` directly execute `createOutboundProvider` with an injected non-network transport. They cover unknown/OTP templates, safe ZeptoMail endpoint and payload, failed 429/no retry, strict nonproduction recipient list, Exotel DLT declarations and provider acceptance SID/status, and canonical email delivery addresses.
- `src/modules/messaging/providers.ts` now uses the successfully parsed request and `normalizeRecipient` before composing a provider request. Previously validation could accept a trimmed address but send the untrimmed input; `messaging-provider-22` tests this repaired source bug.

All tests are **written, not run**. Live provider/DLT and PostgreSQL concurrency checks are not claimed.

### Recruiter email bridge — direct gateway and transaction coverage

- `src/modules/placements/recruiter-message-email-provider.ts` now uses `normalizeRecipient("EMAIL",digest.recipient)` after validating runtime permission and before sending to ZeptoMail. `tests/unit/chat16-recruiter-email-digest-provider-16.test.ts` exercises the **real** `sendRecruiterMessageDigest` implementation with an injected fake network transport: feature disabled/unallowlisted, secure non-OTP template/Reply-To preflight, bounded HTML-escaped last-three excerpts, canonical recipient address, and rejected/ambiguous no-retry sends (`email-bridge-digest-16`–`19`).
- `tests/unit/chat16-recruiter-email-inbound-gates-16.test.ts`: signed inbound gateway rejects disabled bridge, bad HMAC, tampering, malformed/quoted-only replies, foreign reply domain, invalid provider message ID and absent registered storage before transactional writes (`email-bridge-inbound-gate-16`–`18`).
- `tests/unit/chat16-recruiter-email-inbound-transaction-16.test.ts`: actual `acceptAuthenticatedRecruiterEmailReply` against a mocked transactional repository, covering expired reply-token lock, revoked grant, same-thread replay, foreign-thread replay denial, and successful new-message persistence plus TPO notice (`email-bridge-inbound-transaction-16`–`20`). Database values/locks and notification service are mocked, so this is **not** a substitute for real Postgres concurrency, foreign key, or mail-provider webhook integration.

No outbound network or test runner was invoked in this lane. These tests are authored, not CI-verified.

### Private inbox double-submit race closure

`src/components/admin/inbound-mail-list.tsx` now uses a per-component synchronous `createInboundMailTriageGate` to suppress repeated PATCH events even before `busy` triggers a React rerender. Existing `expectedStatus`/`expectedVersion` optimistic concurrency and legacy labels remain unchanged; `finally` releases the gate even when a network or stale-state request fails. `tests/unit/chat16-inbound-mail-double-submit-16.test.ts` cases `inbound-mail-double-submit-16`–`18` exercise the gate directly, instance isolation and UI CAS wiring. Browser double-click and real PostgreSQL stale-version checks still require CI execution.

### Recruiter notification acknowledgement CAS coverage

`tests/unit/chat16-hr-notification-read-cas-16.test.ts` invokes the actual `markHrNotificationRead` service using an injected, in-memory transactional query mock. Named cases `hr-notification-read-16`–`20` verify strict UUID/version parsing, current recruiter principal (not a substituted user), persisted eligible employer-drive scope before any DB read, missing/read/stale notification rejection, compare-and-swap race refusal and confirmed persisted `readAt` projection. Tests are authored, not executed; SQL race conditions and real employer grant expiry require the PostgreSQL integration suite.

### Recruiter conversation reply/read UX mutation guards

`src/components/hr/recruiter-conversation-reply-form.tsx` now gates the entire submit handler synchronously (`submitPendingRef`) in addition to the existing timed `useGuardedAction`, so two same-tick click/shortcut submits cannot cause a second false failure state while the first POST is pending. The reply draft is cleared only after a confirmed redirected success and the gate releases in `finally`. `src/components/hr/recruiter-conversation-read-control.tsx` similarly serializes the initial POST-on-open with manual retry and releases its synchronous gate on success or failure. `tests/unit/chat16-recruiter-messaging-double-actions-16.test.ts` includes `UX-chat16-recruiter-message-reply-01`, `-02` and `UX-chat16-recruiter-message-read-03` source-bound regressions. No legacy wording changed; the browser timing regression remains to be executed in CI.

### CI 834983cc — latest chat-16 failure and compiler triage

`docs/orchestrator/unit-failures-latest.md` currently lists three chat-16 failures: two original 32-gap register reconciliation cases and the recruiter drive-request `REC-home-drives-21` update-contract case. An independent exact-parse of `docs/orchestrator/queues/gap-closure-chat-16.md` and `docs/audit/gap-register.md` yielded **32 distinct original IDs, each with one canonical register row, accepted reviewer ownership and nonempty acceptance citation**; these existing stringent assertions remain unchanged, because the published failure report was generated from a prior CI state. The real stale contract test `tests/unit/recruiter-drive-request-runtime-model.test.ts` now supplies a fully typed draft for `EDIT`/`RESUBMIT` and also asserts missing drafts are rejected, with `CANCEL` accepted only without a draft. No production request schema was weakened.

The typecheck report explicitly labels production typecheck and lint PASS. Its one chat-16 test-file error in `tests/unit/chat16-public-recruiter-join-pages-26.test.ts` arose from mocking a non-existent public readiness message. The test now asserts exact current copy, uses real `"READY"`/`"UNAVAILABLE"` preview shapes and the `null`/`"RATE_TABLE_MISSING"` readiness contract, without `as never` placeholders.

`src/app/company-join/[token]/page.tsx` and `src/app/college-join/[token]/page.tsx` now preserve preview failure recovery and fail closed when the independent readiness probe throws. They skip the readiness probe entirely for invalid/expired/revoked preview, leaving the existing safe invalid-link UI. New `UX-public-join-04` and `UX-public-join-05` cases cover both COMPANY and COLLEGE pages. All CI verification remains pending; no tests were run locally and no success is claimed before the next report.

### Public unsubscribe SSR routes — direct tests

`tests/unit/chat16-campaign-unsubscribe-ssr-pages-16.test.ts` invokes the actual `/campaign-unsubscribe/[token]` and `/campaign-unsubscribe/confirmed` server pages with the read-only token verifier mocked. Cases `UX-campaign-unsubscribe-page-16`–`20` cover global vs placement-cell suppression scope, explicit POST-only confirmation, invalid/expired token no-form state, transient verifier outage Retry with no secret leakage and scoped confirmation display. Tests are unexecuted pending CI. No GET-side persistence was added.

### Legacy authentication alias and recruiter invitation page execution

`tests/unit/chat16-legacy-auth-invite-alias-pages-16.test.ts` invokes all four actual legacy server page exports: `/superadmin-login`, `/e2e/superadmin-login`, `/auth/handoff`, and `/hr-invite/[token]`. Cases `UX-chat16-legacy-auth-alias-16`–`19` enforce redirect-only retirement of test/privileged sign-in bypasses, the visible handoff-retired recovery code, scoped opaque HR invite token redirect and Not Found before redirect for path traversal, external schemes, separators, escapes and short/oversized tokens. Next navigation is mocked; browser/session validation is pending cloud CI.

### Global and placement-cell unsubscribe POST route execution

`tests/unit/chat16-campaign-unsubscribe-post-route-16.test.ts` calls the actual `POST /api/public/campaign-unsubscribe` handler with FormData Requests and mocked token/signature, table registration and TPO recipient mutation collaborators. `campaign-unsubscribe-route-16`–`21` cover same-origin denial before token inspection, missing/unsigned/oversized links, purpose-bound placement-cell scoped redirect, revoked/invalid locked recipient response, unavailable global storage 503 rather than false completion, and signed opaque-key global suppression redirect. Provider and PostgreSQL callbacks are mocked; these tests do not assert physical DB commit or full cross-request races. They are authored pending cloud CI.

### TPO queued-recipient live consent and destination hardening

Previously, `dispatchTpoCampaign` loaded all pending contact facts once, then claimed each recipient `QUEUED` before provider dispatch. If a recruiter unsubscribed, bounced, opted out through `NOT_NOW`, or changed their email **after that initial snapshot**, the dispatch could still use stale contact data. It now re-queries the matching lead by `leadId` **and** `collegeId` after claiming a recipient and before issuing a signed unsubscribe link or calling the provider. `campaignRecipientStillMatchesSnapshot` requires the live lead to remain eligible and the normalized email destination to be unchanged. Missing, suppressed, bounced, deferred or changed recipients are left unsent and transitioned from `QUEUED` to a permitted skipped status; no new schema status was invented. `tests/unit/chat16-tpo-campaign-live-consent-recheck-16.test.ts` exercises these pure decision cases and guards the claim → live scoped lookup → provider ordering.

**Limit:** The live read narrows the stale-data window but does not make an external email send transactionally atomic with a concurrent opt-out. PostgreSQL race tests and provider acceptance tests remain required. No tests were executed locally.

### Queued-to-provider outcome persistence CAS

After `outbound.send` returned, the dispatch service previously issued a guarded `QUEUED` → `SENT`/`FAILED` update but ignored whether any recipient row was actually updated. A concurrent unsubscribe or changed row could therefore still generate a false `SENT` activity and success count. The outcome transition is now additionally campaign-ID-scoped, returns the persisted recipient ID and requires a non-empty CAS result before emitting success activities or finalizing receipts. An ambiguous post-provider failure is not automatically retried, to avoid duplicate mail. `tests/unit/chat16-tpo-campaign-live-consent-recheck-16.test.ts` also asserts the order: provider response → persisted CAS → success logging. Tests and real PostgreSQL conflict behavior remain pending cloud CI.

### Role-oriented direct coverage round — 2026-10-18

The following direct behavioural cases are authored but not yet executed by cloud CI:

| Source boundary | Direct test | Behaviours and limitations |
|---|---|---|
| `src/modules/messaging/public-join-code-delivery.ts` | `tests/unit/chat16-public-join-code-canonical-recipient-16.test.ts` | Canonical normalized address is checked against runtime allowlist and used consistently in ZeptoMail recipient + template merge fields; rejected contacts are denied before loading provider config; injected fake network transport |
| `src/modules/notifications/zeptomail-email.ts`, `exotel-sms.ts` | `tests/unit/chat16-otp-provider-ports-16.test.ts` | Transactional OTP format, DLT settings, E.164, accepted SID/status, bounded single-attempt sends, provider refusal and no OTP in structured logs; outbound transport mocked |
| `src/modules/messaging/engage-audience-service.ts` | `tests/unit/chat16-engage-audience-service-16.test.ts` | Both count-only Engage previews, role and selected-ID validation, persisted authorization before read, duplicate and suppressed counts, no source contact addresses in result; scoped DB transaction mocked |
| `src/modules/messaging/receipt-detail-service.ts` | `tests/unit/chat16-messaging-batch-detail-service-16.test.ts` | UUID/role validation, revoked persisted grant, 404-like null for missing tenant batch, aggregate counts and no contact key leakage; DB transaction mocked |
| `src/app/platform/page.tsx`, `src/app/{error,global-error,not-found,loading}.tsx` | `tests/unit/chat16-public-platform-error-loading-pages-16.test.tsx` | Actual server-rendered public platform and fallback pages, safe recovery links, no exception/digest disclosure, loading indicators, and removal of unsupported AI-agent capability claims |
| `src/app/placements/page.tsx` | `tests/unit/chat16-public-placements-route-16.test.tsx` | Unknown host 404, unpublished college 404, transient public stats outage with no private exception text and recruiting controls disabled; public services mocked |

The marketing route was corrected to describe learner/faculty/mentor/placement/HR workspaces instead of AI agents. These new cases do not establish browser, provider, Postgres, or whole-app green status.

### Public landing, recruiter notifications and draft persistence direct coverage

Additional unexecuted test evidence:
- `tests/unit/chat16-public-placements-route-16.test.tsx`: real `/placements` SSR tenant discrimination, unpublished page 404, publication read outage, private error-redaction, disabled recruiter enquiry before publication.
- `tests/unit/chat16-public-platform-error-loading-pages-16.test.tsx`: real platform public marketing and root error/global-error/loading/not-found SSR, non-sensitive failure recovery, accessible loading and no retired AI-feature claims.
- `tests/unit/chat16-public-auth-real-pages-16.test.tsx` now includes tenant domain resolution outage (no OTP form), revoked/expired/retired-link notices and disabled recruiter email-OTP channel.
- `tests/unit/chat16-tpo-campaign-draft-create-16.test.ts`: real draft creation service with injected SQL transaction, strict template/selection/role validation, persisted grant before lookup, no recipients after opt-out, HMAC recipient-key persistence, and no send during draft creation.
- `tests/unit/chat16-tpo-unsubscribe-live-row-16.test.ts`: real scoped campaign recipient service with invalid purpose HMAC, missing registration, missing locked row and already-unsubscribed idempotence; DB transaction mocked.
- `tests/unit/chat16-hr-notifications-service-16.test.ts`: actual recruiter inbox service with actor, employer grant, multi-college choice, no eligible jobs and scoped job-event projection; DB and grant fetch mocked.

These are authored direct-test cases, not a claim of passed CI, full PostgreSQL concurrency or provider delivery. The source-level stage preserves exact existing role/UI copy except for removing unsupported public AI-agent claims.

### Later CI reconciliation for the three published chat-16 failures

The orchestrator's `docs/orchestrator/unit-failures-latest.md` header still references CI `ff6819dd` / cloud `698eb9dd`, but the newer, **completed** GitHub Actions unit job **117686252023**, run **39131096801** (commit `41f5729cb`), contains success records for:
- `tests/unit/chat16-round3-two-unit-regressions.test.ts`: **3 passing tests**.
- `tests/unit/chat16-gap-register-reconciliation-r7.test.ts`: **34 passing tests**.
- `tests/unit/recruiter-drive-request-runtime-model.test.ts`: **4 passing tests**.

This is direct cloud-log evidence that the **three historical named files** passed at that commit, not a fresh whole-repository green build. That workflow's overall unit job failed because other files failed; its separate typecheck job also failed on `report-interactive-table.tsx`, outside chat-16's scope. New chat-16 tests introduced after `41f5729cb` are still unverified and must not be labeled passing. The orchestrator report is owned by its CI refresh, not manually overwritten by this lane.

### Immutable recipient snapshot binding — post-draft address substitution closed

TPO campaign creation stored a purpose-specific `recipientKey` HMAC of the originally selected email, but dispatch previously selected only the lead's current `emailNorm`. A recruiter address changed **between draft creation and dispatch** could therefore receive a campaign they had never been selected for, while receipts remained keyed to the former address. `issueTpoCampaignEmailRecipientKey` and `matchesTpoCampaignEmailRecipientKey` now share the original `tpo-campaign-email-v1:` signing derivation between `tpo-campaign-draft-service.ts` and `tpo-campaign-dispatch-service.ts`. Dispatch fetches the saved `recipientKey` and verifies it in constant time against the current contact email **before** transitioning PENDING to QUEUED; a mismatch is suppressed rather than forwarded. Existing after-claim live consent and email checks remain in place. `chat16-tpo-campaign-live-consent-recheck-16.test.ts` covers canonical addresses, wrong keys/secret, invalid keys and source claim/send order.

Source authored on the chat-16 branch; run unit/PostgreSQL concurrency/provider acceptance tests in CI before release.

### Refreshed test-file typecheck triage — CI 39270260

The refreshed `docs/orchestrator/typecheck-errors-latest.md` now identifies two chat-16 errors: `chat16-messaging-receipt-history-service-16.test.ts:22` and `chat16-tpo-campaign-draft-live-role-16.test.ts:31`. Both used `vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(undefined)` after that API's return type became `RequestContext`. Both mocks were corrected to return their actual TPO fixture context, preserving the persisted-role assertion. Three newer chat-16 service suites (`chat16-messaging-batch-detail-service-16`, `chat16-engage-audience-service-16`, `chat16-tpo-campaign-draft-create-16`) were proactively corrected in the same manner. No tests were skipped, deleted or weakened. These edits are authored and pushed; the next CI test-file typecheck must verify them.

### Campaign identity, recruiter digest and notification writer additions

The latest authored source and tests add further direct service coverage:

- `src/modules/messaging/tpo-campaign-recipient-token.ts`: `issueTpoCampaignEmailRecipientKey` and `matchesTpoCampaignEmailRecipientKey` are shared by draft persistence and dispatch. The stored purpose-specific HMAC is now verified against the current lead email before claiming a recipient, so a change between **draft creation and dispatch** cannot redirect email to an unselected address. `tests/unit/chat16-tpo-campaign-live-consent-recheck-16.test.ts` directly tests both functions and guards claim-before-send order.
- `src/modules/placements/recruiter-message-email-dispatch-service.ts`: within the locked send transaction, a SQL `exists` check re-verifies active recruiter user/profile, active verified `DRIVES` grant with valid date, same college/company relationship, active college/company, job relationship and unchanged recipient email. `tests/unit/chat16-recruiter-email-digest-live-grant-16.test.ts` tests feature-disabled, weak-key and revoked-grant fail-closed paths without external sends.
- `src/modules/placements/hr-tpo-notification-service.ts`: `tests/unit/chat16-hr-tpo-notification-writer-16.test.ts` exercises missing college, scoped event+notification writes, slot href and empty-recipient no-op using the caller's mocked transaction.
- `src/modules/placements/tpo-my-notification-preferences-write.ts`: `tests/unit/chat16-tpo-notification-preferences-write-16.test.ts` covers global actor, unregistered storage, persisted live TPO role, stale optimistic versions, audit writes and idempotent no-op retries.
- `src/modules/placements/tpo-my-notifications-service.ts`: `tests/unit/chat16-tpo-personal-notification-read-16.test.ts` covers role, strict filters, own-college fixed-label projection and final persisted-role authorization after list queries.
- `src/app/enterprises/page.tsx` and `src/app/universities/page.tsx`: removed remaining false marketing claims of active AI functionality, keeping navigation and demo CTAs. The existing real SSR marketing suite asserts the replacement headings.

These are authored and pushed to the lane branch. **CI runs after these specific commits are not yet complete**, so database locks, provider delivery and full browser behavior remain separate release gates.

### Internal recruiter mail HTTP and campaign send endpoint gates (chat-16)

- `tests/unit/chat16-recruiter-mail-http-boundaries-16.test.ts`: tests actual `POST /api/internal/placements/recruiter-message-inbound` against wrong origin, 20 KiB body cap before HMAC, exact signed raw body, failed authentication, replay acknowledgment and redacted service failure; tests authenticated `POST /api/internal/placements/recruiter-message-reminders` against missing/weak or incorrect bearer, cross-origin request, accepted-but-zero-delivery result and sanitized worker failure. No provider webhook or scheduling network calls are made; mocked service methods remain the trusted boundary.
- `tests/unit/chat16-tpo-campaign-dispatch-route-16.test.ts`: actual `POST /api/placements/tpo/campaigns/drafts/[campaignId]/send` tests origin rejection before resolving session, malformed UUID 422, NOT_READY 503, NOT_FOUND 404, ALREADY_STARTED 409, confirmed service counters without fabricated successful delivery, and safe fallback for unexpected errors.

The above tests were authored and committed without execution; externally authenticated scheduling, real HMAC trust-chain integration, provider acceptance and database transactions still require cloud/integration verification.

### Recruiter public invitation OTP HTTP journeys (chat-16)

`tests/unit/chat16-recruiter-invite-otp-http-16.test.ts` exercises the actual two public mutation handlers `/api/public/recruiter-invite/[token]/send-code` and `/api/public/recruiter-invite/[token]/accept`. Named cases `REC-INVITE-HTTP-16`–`22` verify same-origin denial before any service, malformed opaque token denial, unverified DB/OTP delivery gates returning 503, code requests invoking the dedicated delivery adapter, uniform expired/used/throttled/unavailable result (no contact/address oracle), strict 6-digit body with no caller-claimed email/user ID, and server-confirmed join response. The underlying OTP, persisted grant and provider services are mocked; no real messages or identities are created.

Syntax check of this and the preceding two new HTTP files confirmed balanced `()/[]/{}`, no line-break-before-`as` casts, and no test suppression comments. **Cloud CI has not run these new tests**.

### PostgreSQL opt-out concurrency (chat-16)

`tests/integration/t-s2-04-campaign-unsubscribe.test.ts` now selects the canonical `TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET` used by production issue/verify flows and asserts the current exact CRM timeline `Unsubscribed from emails`, rather than a stale legacy copy. Added `T-S2-04 concurrent recipient opt-outs serialize and emit exactly one event and timeline`: two authenticated, simultaneously submitted signed opt-outs for one real recipient must both finish idempotently, leave the row `UNSUBSCRIBED`, and persist **exactly one** lead activity. This test is gated by the repository's explicit disposable DB09 PostgreSQL environment, never production. **Authored, not executed**; its passing status requires cloud isolated-DB CI.

### Lane checklist — master queue and final-sprint reconciliation

| Chat-16 work item | Current authored evidence | Verification boundary |
| --- | --- | --- |
| Master queue 1: HR/recruiter messaging, campaigns, notifications, email bridge, inbound mail | The direct unit suites above cover message policy, batch send/receipt, campaign draft+dispatch, selected audience, recruiter digest, signed reply inbound, recruiter/TPO bell delivery and versioned inbox triage. Added actual internal mail HTTP route and campaign-send route tests. PostgreSQL integration tests include real scoped recruiter notices and signed campaign unsubscribe with a concurrent idempotence case. | Authored, pending latest cloud CI, external provider credentials and isolated-DB race run; do not treat provider acceptance as handset/inbox delivery. |
| Master queue 2: public/auth pages and page-level tests | Actual React SSR tests cover tenant-resolved login and expired-session recovery, recruiter/college/company joins, signed invitations and their code/accept mutation routes, public unsubscribe and confirmation, company share code gate, public placements, platform/university/enterprise marketing, health/readiness, global/not-found/loading and retired legacy redirects. | Authored, pending current cloud CI and browser focus/responsive/session tests. |

All **ten** chat-16 final-sprint IDs are represented by named tests under `tests/unit/chat16-final-*.test.ts` and acceptance entries: `LEARNER-learning-misc-01` (secure R2/scanner end-to-end **BLOCKED**), `-07` (**NOT-A-GAP** on unsafe legacy file types), `-12` (Google Drive OAuth import **BLOCKED**, safe local-download fallback), `-25` (**NOT-A-GAP** for executable arbitrary question HTML/unsupported grading), `COL-placements-02`, `-10`, `-12` (authored-source **DONE**), and `SA-tenants-modules-25`, `-29`, `-35` (authored-source **DONE**). Integration/browser/provider status remains independently gated.

The original 32 reassigned mentor/SA tracker IDs have named queue and registry reconciliation tests; old published failures were later shown passing on commit `41f5729cb` in GitHub Actions run `39131096801`, but **this does not certify any newer commit**. The latest orchestrator error report still contains those older failures; it must be refreshed from a new completed CI run. No release-green assertion, deleted test, bypassed permission, or invented provider delivery is recorded.

### Public college/company recruiter join API boundaries and exceptional failure recovery (chat-16)

`tests/unit/chat16-public-company-college-join-http-16.test.ts` invokes **all four actual public POST endpoints** (COMPANY/COLLEGE code request and acceptance), with deterministic injected OTP/grant service mocks. Named cases `REC-JOIN-HTTP-16`–`24` verify cross-origin denial before service work, ignored client-IP header before trusted-proxy verification, verified network identity propagation, success only after service confirmation, missing network-gate 503, limited request 429, no-MX rejection, missing phone-storage 503, sanitized unexpected service errors, and malformed JSON treated as invalid input rather than an uncaught handler failure.

Both COMPANY and COLLEGE route pairs now catch unexpected provider/database exceptions and return `503 SERVICE_UNAVAILABLE` with `Cache-Control: no-store`, rather than throwing raw internal errors to framework handling. The join handlers safely decode malformed JSON to `null` before handing it to the strict acceptance service (400 `COULD_NOT_JOIN` if invalid). Known structured `PublicJoinCodeError` and `PublicJoinAcceptError` mappings remain unchanged. A static scan of eight edited/new TypeScript files found balanced delimiters, no line-break-before-as casts and no test suppression directives.

These are authored tests and source checks, **not run CI**. Public provider acceptance, rate-limiter PostgreSQL behavior and browser experience remain integration acceptance gates.

### Refreshed orchestrator typecheck triage

The published `docs/orchestrator/typecheck-errors-latest.md` is based on CI commit `007415ee`, preceding these fixes. Its **10** reported chat-16 test-file errors span seven files: persisted-actor mocks returning `undefined` instead of `RequestContext`; a mock loop widened outside `RequestContext`; nullable provider-call options; and public-placement SSR headers/content stubs with incorrect types. The branch now returns proper persisted actor contexts, explicitly types denied contexts, asserts `options` before reading request bodies, and uses a `Headers` object plus a correctly shaped public-content result. No `@ts-ignore`, no reduced assertions, and no broken-line `as` casts were introduced.

The 32-gap reconciliation failures in the older `unit-failures-latest.md` were shown passing in a later completed CI run at `41f5729cb`, but the latest commit's full tests and TypeScript test-file checks are **not yet verified**. The shared reports are CI-owned and have not been manually declared green.

### Source-level contract check for HTTP test fixtures

The COMPANY/COLLEGE code request tests now submit exactly `{token,email}`, matching `publicJoinSendCodeSchema.strict()`. The corresponding join attempts submit `{token,email,code,name,designation,phone,companyName}`, matching `publicJoinAcceptSchema.strict()`. This avoids a falsely passing route test that used a code-bearing payload for send-code, which the real validation service would reject. The source's fail-closed handling and the tests continue to exercise the same public routes. Actual CI execution is still required.

### Direct OTP provider and HR notification presentation matrix (chat-16 follow-on, 2026-10-18)

| Export / boundary | Behaviour under isolated direct test | Evidence |
|---|---|---|
| `notifications/zeptomail-email.ts`: `readZeptoMailConfig`, `isSecureMailProviderEndpoint`, `createZeptoMailEmailProvider` | env override, unsafe URL rejection, malformed OTP/email no-send, normalized envelope and merge address, accepted HTTP, 429 and transport rejection without ambiguous retry | `tests/unit/chat16-otp-notification-provider-contract-16.test.ts` |
| `notifications/exotel-sms.ts`: `readExotelConfig`, `createExotelSmsProvider` | missing DLT, phone/code/account validation, registered fields and OTP copy, SID plus queued acceptance only, negative provider result and broken JSON no-send | `tests/unit/chat16-otp-notification-provider-contract-16.test.ts` |
| `placements/hr-conversation-unread-model.ts`: `summarizeRecruiterUnread` | empty and nonnegative aggregate | `tests/unit/chat16-hr-notification-display-contract-16.test.ts` |
| `placements/hr-notification-groups-model.ts`: `groupHrNotificationPage` | stable grouping and unread tally | same |
| `placements/hr-notification-read-feedback-model.ts`: `hrNotificationReadError` | explicit 401/403/404/409/429/503 safe copy | same |
| `placements/hr-team-roster-message-model.ts`: `hrTeamRosterMessage` | empty, filtered, paged, sole-recruiter and populated states | same |
| `placements/recruiter-message-tpo-notification-model.ts`: `recruiterMessageTpoRecipients`, `recruiterMessageTpoHref`, `recruiterMessageTpoPreview`, `RECRUITER_MESSAGE_TPO_TITLE` | deduplicated active recipients excluding sender, safe link fallback, bounded codepoints and exact title | same |

**Fix:** OTP email provider now canonicalizes a validated address before constructing both the recipient envelope and merge payload; previously caller case/whitespace could pass inconsistently between validation and delivery. Tests were authored, **not executed**. Real network, inbox receipt, phone delivery, privileged session, browser accessibility, PostgreSQL concurrency and all outstanding broad matrix branches still require runtime validation. This table does not claim whole-module exhaustive coverage.

### Legacy privileged bookmark destination fixed (chat-16, 2026-10-18)

The platform root intentionally redirects anonymous visitors to the public marketing `/home` page, so old `/superadmin-login` and `/e2e/superadmin-login` aliases incorrectly sent staff toward marketing instead of the explicit OTP sign-in entry. Both now redirect directly to `/login`, preserving the privileged second factor and never accepting test-only credentials. The existing stricter legacy-redirect tests have been updated to assert `/login` rather than the broken root destination; a new invoked-page test `UX-superadmin-login-16` is in `tests/unit/UX-chat16-public-auth-legacy-bookmarks-03.test.ts`. The real root/login route is already independently exercised by `UX-chat16-auth-platform-01`. Browser navigation and cloud CI are pending; this is a verified source-level correction, not a runtime test pass.

### Direct public recruiter join-code dispatch and legacy page redirects

`tests/unit/chat16-public-join-code-delivery-16.test.ts` invokes `deliverPublicRecruiterJoinCode` with a fake HTTP transport and isolated environment for test-recipient gating, invalid email/code/config, explicit no-redirect provider request, canonical envelope+merge text, and upstream failure without fabricated delivery (`REC-JOIN-DELIVERY-16`–`19`). This adds direct import evidence for the previously missing `src/modules/messaging/public-join-code-delivery.ts` weak-area row. It does not send real mail, attest MX/provider delivery, or assert real OTP persistence.

`tests/unit/chat16-public-legacy-invite-handoff-16.test.ts` invokes the actual `/hr-invite/[token]` and `/auth/handoff` React page functions (`UX-hr-invite-direct-16`, `UX-hr-invite-denied-16`, `UX-handoff-direct-16`), checking safe same-origin navigation, malformed-token 404, and a retired credential handoff without exchanging a token. These complement, but do not replace, browser/mobile/expired-session checks. All tests written and unexecuted.

### Recruiter drive inbox and notification preview hardening

`tests/unit/chat16-hr-drive-conversation-scope-16.test.ts` directly invokes `getRecruiterDriveConversations` and `recruiterDriveThreads`, with an injected authorized workspace and a deliberately contaminated upstream thread list. Cases `HR-DRIVE-MESSAGES-16`–`19` cover malformed UUID before IO, revoked grant fail-closed, three-way company/college/job ownership filtering and nonmutating empty/general-thread exclusion. This strengthens the weak-area row for `src/modules/placements/hr-drive-conversation-service.ts` but is not a real persisted-grant race test.

`REC-calendar-messages-profile-17` notification previews now collapse control characters and whitespace to a single line before the existing 120-codepoint cap; this prevents untrusted multiline recruiter text from spilling into a one-line TPO bell while preserving substantive readable content. The new direct test covers CR, LF, tab, NUL, astral emoji and truncation. No notification recipient permission logic or legacy static title changed. Cloud CI and PostgreSQL/provider/browser execution remain pending.

### Inbound mail active-triage state repaired (chat-16)

The private inbound ledger had a `Being handled` tab and an allowed persisted `TRIAGED` status, but no button to enter it; `changeInboundMailStatusForAdmin` explicitly rejected that transition. `src/modules/inbound-mail/triage-transition-model.ts` now implements NEW→TRIAGED/RESOLVED, TRIAGED→NEW/RESOLVED, RESOLVED→NEW (reopen), denying duplicate and completed→TRIAGED shortcuts. `src/components/admin/inbound-mail-list.tsx` offers context-appropriate named actions including `Mark being handled`, retaining `Mark done`/`Move back to To read`. `changeInboundMailStatusForAdmin` retains global Super Admin-only authorization, strict parsed expected status/version and SQL compare-and-swap. `tests/unit/chat16-inbound-mail-transition-machine-16.test.ts` cases `INBOUND-TRIAGE-16/17` enumerate all nine transitions and exact action labels. `chat16-inbound-mail-admin-versioning-16.test.ts` now tests accepted TRIAGED write (`inbound-mail-write-21`) and forbidden completed shortcut (`-22`); `chat16-inbound-mail-status-route-16.test.ts` tests `inbound-mail-route-21` confirmation. Authored without execution; PostgreSQL concurrency and browser checks remain pending.

A further defensive check keeps an unexpected status from crashing the React drawer: `inboundMailStatusActions("UNKNOWN")` returns an empty action list rather than `undefined`, and the UI no longer trusts the unvalidated row status via an unsafe type cast. `INBOUND-TRIAGE-18` tests malformed and future statuses. No fake status change is offered.

### Disposable PostgreSQL inbound mail transaction witnesses

`tests/integration/chat16-inbound-mail-triage-cas-pg.test.ts` adds `INBOUND-TRIAGE-PG-16`–`18` against an explicitly isolated PostgreSQL database (requires matching `TEST_DATABASE_URL`/`DATABASE_URL` plus `DB03_ISOLATED_TEST_DATABASE=1` and the disposable-target guard). Two concurrent genuine `changeInboundMailStatusForAdmin` attempts must result in one UPDATED, one STALE and a single version increment; completed items require reopening before TRIAGED; wrong role, suspended platform and acting-college scope cannot read or mutate. Every generated row is deleted after the suite. This **test is authored, not run**; no claim that the PostgreSQL race has passed and no production database is accessed.

The inbound triage client also bounds its private PATCH with a 15-second AbortController, clears the timeout and releases its synchronous submit gate in `finally`, and treats an ambiguous timeout as a reason to **refresh before retrying** rather than claiming failure or submitting a duplicate. `inbound-mail-double-submit-18` now statically verifies timeout wiring along with optimistic concurrency and same-origin credentials. No actual network calls were made.

### Messaging pure-export coverage reconciliation (chat-16)

New direct model suite `tests/unit/chat16-messaging-remaining-model-exports-16.test.ts` covers previously unlisted exports without mocking their core decisions. Each matrix row names the exported function or schema and the named cases; this is authored source, **not executed**.

| Source | Export / function | Direct behavioral witness |
|---|---|---|
| `campaign-filter-model.ts` | `campaignFilterSchema`, `campaignFilterHref` | `MESSAGING-FILTER-16`: defaults, encoded query, unknown state, overflow, forged tenant selector |
| `campaign-source-model.ts` | `campaignSourceSchema` | `MESSAGING-SOURCE-16`: allowed referral/other; forbidden missing OTHER detail, unknown source, excess fields |
| `engage-audience-model.ts` | `engageAudienceQuerySchema`, `summarizeEngageAudience` | `MESSAGING-AUDIENCE-16`: strict segment enums and identical suppression precedence for eligible/empty/opt-out/bounce/NOT_NOW |
| `template-boundary-model.ts` | `isCampaignTemplateKey` | `MESSAGING-TEMPLATE-16`: auth/OTP/recovery keys suppressed, legal campaign templates accepted |
| `tpo-campaign-history-copy.ts` | `tpoCampaignHistoryTime`, `tpoCampaignHistoryStatus` | `MESSAGING-HISTORY-16`: exact IST time, safe legacy labels and unknown-status fallback |
| `tpo-campaign-unsubscribe-notification-model.ts` | `tpoCampaignUnsubscribeEvent` | `MESSAGING-UNSUB-NOTICE-16`: sanitized personal names, preserved timeline, encoded lead hyperlink |
| `unsubscribe-model.ts` | `issueUnsubscribeToken`, `verifyUnsubscribeToken`, `unsubscribeConfirmation` | `MESSAGING-UNSUB-TOKEN-16`: HMAC binding, expiry boundary, noncanonical/forged input, GET read-only semantics |

Types/interfaces are compile-time contracts rather than runnable exports; they are represented by the values and functions above. Other exported service functions are covered in the prior ledger sections or need additional verification, and this suite does not claim network or real database execution.

### TPO messaging aggregate detail and draft storage gates

`tests/unit/chat16-messaging-receipt-detail-readiness-16.test.ts` now invokes previously underlisted exported services. `getTpoMessagingBatch` cases `MESSAGING-DETAIL-16`–`19` check batch UUID/role denial before storage, college permission denial, persisted permission check inside transaction, aggregate-only receipt projection, and absent-batch null (never a guessed tenant result). `tpoCampaignDraftStorageReady` case `MESSAGING-DRAFT-READY-16` confirms a disabled deployment never queries DB and registered/not-registered/transport failure returns correct readiness without fabricating success. These use mocked SQL builders and error pathways; they are **not** substitute PostgreSQL tenant or concurrency results.

### Campaign configuration / receipt projection boundary matrix

`tests/unit/chat16-messaging-provider-history-contract-16.test.ts` adds direct behavior for previously unmapped exports. `resolveTpoCampaignRecipientSecret` is tested in `MESSAGING-CONFIG-16` for canonical/legacy precedence and deliberately empty canonical keys; `readOutboundProviderConfig` in `MESSAGING-PROVIDER-CONFIG-16` covers separate provider environments and retained registered template keys. `tpoCampaignDispatchReady` case `MESSAGING-DISPATCH-READY-16` rejects absent/OTP deployment settings before claiming send readiness; this does **not** exercise a real provider. `isExotelAcceptedResponse` `MESSAGING-EXOTEL-ACCEPT-16` checks positive SID+status and negative malformed/failure acknowledgements. `messagingHistoryQuerySchema`/`projectMessagingHistory` `MESSAGING-HISTORY-PROJECTION-16` check bounded strict query parsing and explicit `acceptedByProvider` rather than inventing handset/inbox delivery. No external provider called. All tests authored, not executed.

### Selected / whole Engage audience services — protected aggregation

`tests/unit/chat16-messaging-engage-audience-service-16.test.ts` invokes both previously underlisted service exports with permission and DB transaction boundaries mocked. `previewEngageCampaignAudience` cases `MESSAGING-ENGAGE-SCOPE-16` and `-COUNT-16` check TPO-only authorization, strict segment, persisted actor and college scope, and count-only projection. `previewSelectedTpoCampaignAudience` cases `MESSAGING-SELECTED-VALIDATE-16`, `-SCOPE-16`, `-COUNT-16` check invalid/duplicate/empty selection, foreign role/revoked scope, and suppressed/eligible/unavailable counts without contact details. The selection's 100-ID cap is enforced by the original schema; the service tests use representative inputs rather than 100+ heavy fixtures. These are mocked-transaction behavioral checks, not a claim of a PostgreSQL race or provider send.

### TPO campaign draft and recipient-status service fail-closed matrix

`tests/unit/chat16-messaging-campaign-draft-boundaries-16.test.ts` invokes model exports `tpoCampaignDraftSchema`, `previewTpoCampaignText` and exact unavailable copy (`MESSAGING-DRAFT-SCHEMA-16`, `MESSAGING-DRAFT-PREVIEW-16`). It also invokes every draft-store service export: `createTpoCampaignDraft` (`MESSAGING-DRAFT-CREATE-16`), `listTpoCampaignDrafts` and `getTpoCampaignDraft` (`MESSAGING-DRAFT-READ-16`), and `listTpoCampaignRecipientStatuses` (`MESSAGING-DRAFT-READ-16`, `MESSAGING-DRAFT-DENY-16`). The tests deliberately disable `DB09_TPO_API_READY` to prove that unavailable storage never pretends to return a successful empty campaign, that invalid inputs/OTP templates and removed roles deny before DB work, and that raw template text is not interpreted by the model as trusted HTML. Browser React text escaping is tested elsewhere. This is the **unavailable and validation branch only**; happy persistence, CAS and sending require the existing isolated database/provider suites. Authored without executing tests.


### 2026-10-19: bounded recruiter inbound mail and uncovered permission/state edges

The internal `/api/internal/placements/recruiter-message-inbound` POST previously called `request.text()` before testing its 20,000-byte body cap, letting a client force an unbounded allocation before the size guard. `src/modules/placements/recruiter-mail-body-model.ts` now reads `Request.body` incrementally, rejects over-cap UTF-8 bytes and malformed sequences before any HMAC verification or persistence, and retains the exact original decoded text for the signature. `src/app/api/internal/placements/recruiter-message-inbound/route.ts` retains its same-origin guard and its denial/friendly outage mapping. Test suites are authored, not executed; streamed network/CDN ingress behaviour still requires integration verification.

| Export / route | Test | Direct behaviour asserted |
|---|---|---|
| `readBoundedRecruiterInboundBody` | `tests/unit/chat16-recruiter-mail-body-bounds-01.test.ts` (`HR-MAIL-INBOUND-01..05`) | 20 KB exact-byte acceptance, UTF-8 byte excess denial, malformed byte refusal, multibyte exact-text preservation, invalid limit rejection |
| `POST /api/internal/placements/recruiter-message-inbound` | `tests/unit/chat16-recruiter-mail-inbound-route-01.test.ts` (`HR-MAIL-ROUTE-01..05`) | same-origin denial before signature, 413/400 before service, valid raw body and signature forwarding, invalid signature denial, redacted 503 |
| `campaignRecipientStillMatchesSnapshot` | `tests/unit/chat16-campaign-snapshot-consent-matrix-02.test.ts` (`HR-CAMPAIGN-SNAPSHOT-01..03`) | unchanged normalized recipient accepted; changed address, revoked consent, bounced and NOT_NOW blocked |
| `resolveTpoCampaignRecipientSecret`, `issueTpoCampaignEmailRecipientKey`, `matchesTpoCampaignEmailRecipientKey` | same (`HR-CAMPAIGN-HMAC-04`, `HR-CAMPAIGN-SECRET-05`) | key binding, wrong-secret and forged-key denial, strict canonical-secret precedence |
| `inboundMailStatusTransitionAllowed`, `inboundMailStatusActions`, `createInboundMailTriageGate` | `tests/unit/chat16-inbound-triage-state-matrix-02.test.ts` (`INBOUND-TRIAGE-01..03`) | all nine state pairs, action parity, duplicate guard and retry release |
| `inboundMailMetadataSchema`, `inboundMailListQuerySchema`, `safeInboundPreview` | same (`INBOUND-TRIAGE-04..05`) | strict metadata/filters, malformed role/scope fields and sanitized display |
| `ownsHrNotificationActor`, `hrNotificationReadSchema`, `hrNotificationVersionMatches` | `tests/unit/chat16-hr-notification-identity-matrix-02.test.ts` (`HR-NOTIFICATION-IDENTITY-01`, `HR-NOTIFICATION-VERSION-02`) | active persisted identity, role revocation and optimistic token failures |
| `summarizeRecruiterUnread`, `safeRecruiterEmailAddressName` | same (`HR-NOTIFICATION-UNREAD-03`, `HR-NOTIFICATION-MAIL-NAME-04`) | corrupt cached bell counts clamped, CRLF/bidi stripped and no surrogate split at 160-code-unit limit |

These rows establish direct unit behaviour only. Tests, TypeScript, database concurrency, actual provider signatures and browser/API journeys **have not been run in this lane**. A complete whole-repository coverage certificate is not claimed.

### 2026-10-19: reminder-worker authentication and public placement page failures

| Export / route | Direct test witness | Behaviour recorded |
|---|---|---|
| `POST /api/internal/placements/recruiter-message-reminders` | `tests/unit/chat16-recruiter-mail-reminder-route-02.test.ts` (`HR-MAIL-REMINDERS-01..05`) | cross-origin denial, absent/forged/misformatted bearer denial, misconfigured whitespace worker secret fails closed, single valid dispatch, generic outage |
| `PublicPlacementsPage` (`/placements`) | `tests/unit/chat16-public-placement-page-states-03.test.tsx` (`UX-chat16-public-placements-*-01..06`) | unknown host and explicitly unpublished 404, only public aggregate labels and release date, stats outage/branding outage stay safely available, failed public content read falls back without private SQL text |
| `tpoCampaignUnsubscribeEvent` | `tests/unit/chat16-campaign-snapshot-consent-matrix-02.test.ts` (`HR-CAMPAIGN-UNSUB-NAME-06`) | untrusted long emoji-bearing names never truncate into an invalid surrogate; existing normal legacy sentence unchanged |

The reminder worker route now enforces a nonblank, non-whitespace-quoted configured credential and explicit Bearer syntax before it can invoke the job. These checks complement, not replace, the worker's real recipient-grant rechecks and provider/DB verification. `readBoundedRecruiterInboundBody` now also preserves UTF-8 BOM bytes in decoded signed input instead of silently dropping them; `HR-MAIL-INBOUND-04` covers that boundary. This ledger records **authored-only** direct tests; typecheck, Vitest, browser journeys, real PostgreSQL and upstream gateway signature acceptance remain unexecuted in chat-16.


### 2026-10-19: public/auth fallback and quiz/platform page closure

| Route / export | Direct page-level evidence | States asserted |
|---|---|---|
| `/quiz` default page | `tests/unit/chat16-public-quiz-platform-states-04.test.tsx` (`UX-chat16-public-quiz-page-01`) | quiz return navigation, tap-size, mobile layout and no session token in static shell |
| `/platform` marketing page | same (`UX-chat16-public-platform-page-02`) | exact role offerings, lifecycle copy, published metadata |
| `/placements` not-found | same (`UX-chat16-public-placement-404-03`) | safe unpublished explanation instead of database diagnostics |
| `/platform`, `/quiz`, `/placements`, `/privacy-policy` loading route components | same (`UX-chat16-public-loading-04`) | each supplies shared loading boundary for recovery |
| `/login` loading + error | `tests/unit/chat16-public-auth-error-states-05.test.tsx` (`UX-chat16-login-loading-05`, `UX-chat16-login-error-06`) | mobile width, loading state, public safe home recovery and no leaked provider exception |
| `/platform`, `/quiz`, `/placements`, `/privacy-policy` error route components | same (`UX-chat16-public-route-errors-07..08`) | route-specific shared fallback and safe public recovery |

These are newly authored SSR/mocked-boundary page tests; actual mobile viewport/focus/browser behaviour still needs the final browser suite. The newly authored tests and application changes remain **unexecuted** per owner priority: do not chase CI until the full task queue has been implemented.


| `GET /health`, `GET /ready` | `tests/unit/chat16-public-health-readiness-http-06.test.ts` (`UX-chat16-public-health-route-01`, `UX-chat16-public-ready-route-02`, `UX-chat16-public-ready-outage-03`) | public liveness, readiness 200/503, no database credentials or stack details exposed |

The public HTTP probes mock the system-readiness collaborators; they do not establish a successful disposable PostgreSQL connection. No automated runtime tests were run by chat-16.

### 2026-10-19 continued: Unicode safety, signed inbound service cap and adversarial bell copy

| Function / route | Direct tests | Cases |
|---|---|---|
| `safeRecruiterEmailMergeText`, `safeRecruiterDigestMessages` | `tests/unit/chat16-messaging-unicode-boundaries-07.test.ts` (`HR-EMAIL-DIGEST-UNICODE-01`) | emoji at HTML excerpt boundary, partial entity removal, newline escaping, digest ordering |
| `conversationSnippet` | same (`HR-CONVERSATIONS-UNICODE-02`) | no unpaired surrogate in one-line recruiter inbox excerpt; zero/nonfinite limits |
| `safeInboundPreview`, `safeMailDrawerText` | same (`INBOUND-MAIL-UNICODE-03/04`) | safe 1,000-character list and 100 KB drawer boundaries, control removal |
| `acceptAuthenticatedRecruiterEmailReply` | `tests/unit/chat16-recruiter-mail-inbound-service-byte-cap-08.test.ts` (`HR-MAIL-INBOUND-BYTES-08..10`) | oversized signed JSON rejected before DB access, multibyte byte cap, disabled bridge |
| `recruiterMessageTpoPreview`, `recruiterMessageTpoRecipients`, `recruiterMessageTpoHref` | `tests/unit/chat16-recruiter-bidi-notification-safety-11.test.ts` (`REC-MESSAGE-BIDI-11`) | prevent bidirectional-control spoofing, preserve joining emoji and codepoint cap, recipient dedupe, safe fallback URL |
| `tpoCampaignUnsubscribeEvent` | same (`TPO-UNSUB-BIDI-12`) | prevent direction-spoofed recruiter name in TPO bell while preserving legacy wording |
| `safeInboundPreview` | same (`INBOUND-MAIL-BIDI-13`) | strip override/isolate controls in untrusted inbound-mail subject but leave ZWJ emoji intact |

All cases are **authored but unexecuted**. Existing tests are retained. No actual provider send, PostgreSQL concurrency, branch-percentage certification or visual inspection is claimed.


### 2026-10-19: first-policy-read outage must not abandon the delivery ledger

| Function | Behavioral test | Cases |
|---|---|---|
| `deliverBatch` (initial policy failure branch) | `tests/unit/chat16-messaging-initial-policy-outage-14.test.ts` (`MSG-POLICY-INITIAL-14`, `MSG-POLICY-INITIAL-15`) | A failing initial authorization/suppression policy read records `FAILED/policy-read-failed` with opaque recipient key before any send. A later eligible contact can still send and complete aggregate audit; an all-recipient policy outage leaves no queued/unconfirmed sends and records exact failed totals. Errors and recipient addresses are not copied to receipts. |

Fix `src/modules/messaging/service.ts`: the previous unhandled initial `policyFor` exception could abort a partially-sent batch before calling `repository.auditBatch`, even when the preceding recipient had already been accepted by the provider. The new fail-closed branch continues the remaining recipients and emits complete receipt counts. Existing retryless provider POST and secondary live-policy recheck stay unchanged. This is unit-level test authorship, **not executed**; multi-worker PostgreSQL concurrency still needs acceptance.


### 2026-10-19 continued: public recruitment and code API hardened against oversized and partial failures

| Boundary | Behavioral tests | Cases |
|---|---|---|
| `POST /api/public/recruit-from-us/send-code` | `tests/unit/chat16-public-recruit-enquiry-route-guards-16.test.ts` (`PUBLIC-ENQUIRY-FAIL-16..21`, `PUBLIC-ENQUIRY-SIZE-24/25`) | Deny cross-origin before private lookup, unknown college 404, tenant DB/provider 503 with no private stack, normal success, trustworthy IP only when proxy verified, status 429/503, invalid UTF-8/JSON 400, UTF-8 byte cap 413 before sending |
| `POST /api/public/recruit-from-us/recruit` | same | Same-origin, active verified tenant, 404/503/error mapping, no untrusted proxy IP, bounded POST before enquiry transaction |
| `readPublicRecruitEnquiryBody` | same (route-through tests) | 8,192-byte UTF-8 body guard, parsed unknown JSON for existing strict Zod service schemas, invalid/oversized body never accesses storage or sends mail |
| `readBoundedUtf8Body` / `readBoundedRecruiterInboundBody` | `tests/unit/chat16-recruiter-mail-body-bounds-01.test.ts`, route-through tests above | Single shared bounded streaming implementation handles signed internal 20 KB and anonymous 8 KB ingress; raw signed bytes (including BOM) are preserved |

Bug fixes: both public recruitment POST routes previously let unexpected tenancy or service exceptions bubble as unhandled request errors, and read anonymous JSON with unbounded `request.json()`. They now return a cache-disabled, generic no-private-data error on dependency failure and reject oversized/malformed payloads before recruiter onboarding service work. This is authored source only; browser/provider and PostgreSQL runtime verification remain **not run**.


### 2026-10-19: campaign opt-out and college/company join anonymous body caps

| Public boundary | Behavioral tests | Outcomes |
|---|---|---|
| `POST /api/public/campaign-unsubscribe` | `tests/unit/chat16-public-campaign-unsubscribe-body-bounds-26.test.ts` (`PUBLIC-UNSUB-SIZE-26..29`) | Strict 8 KB streamed form cap, malformed UTF-8/absent token denied before HMAC or DB, multipart signed campaign recipient still redirects with 303, cross-origin denied before body parse |
| `POST /api/public/company-join/send-code` and `/college-join/send-code` | `tests/unit/chat16-public-join-route-stream-guards-30.test.ts` (`PUBLIC-JOIN-SIZE-30..33`) | Origin, byte limit, invalid JSON, company versus college scope, trusted-proxy IP condition, no delivery call before valid bounded input |
| `POST /api/public/company-join/join` and `/college-join/join` | same | Duplicate four-route boundary matrix, verified IP authority, original successful response shape |
| `readBoundedJsonBody` | same, plus `tests/unit/chat16-public-recruit-enquiry-route-guards-16.test.ts` | Shared strict UTF-8 + 8 KB JSON parser, fail closed before downstream service or rate-limit read |
| `readPublicRecruitEnquiryBody` | `tests/unit/chat16-public-recruit-enquiry-route-guards-16.test.ts` | Named compatibility export preserves the public recruitment route contract through shared parser |

These routes previously parsed unbounded anonymous JSON or form-data bodies; all now reject oversize payloads at the stream boundary and keep their original business validation and response copy. Sources and tests are **authored but not executed**; upstream reverse proxy caps and real provider/PostgreSQL behaviour remain to be independently verified.


### 2026-10-19: recruiter OTP acceptance under an anonymous body cap

| Boundary | Authored direct test | Behaviour |
|---|---|---|
| `POST /api/public/recruiter-invite/[token]/accept` | `tests/unit/chat16-public-recruiter-invite-accept-byte-cap-34.test.ts` (`PUBLIC-INVITE-SIZE-34..36`) | unauthenticated 8 KB stream cap before Zod/identity mutation, malformed body and forbidden caller-field injection refused, same-origin first, readiness gate retains 503, valid six-digit OTP delegates only code and parsed name before no-store success |
| `readBoundedJsonBody` | above and `tests/unit/chat16-public-join-route-stream-guards-30.test.ts` | shared validated JSON primitive prevents the public recruiter invite, college join, company join and enquiry endpoints from buffering unbounded request bodies |

The strict credential HMAC/one-time-code, tenant and real database-commit guards remain owned by the downstream services; these tests do not substitute real disposable PostgreSQL transaction or provider execution. All added tests are authored but unexecuted.


### 2026-10-19: anonymous recruiter invitation route methods and nonmutation

| Handler | Direct regression test | Cases |
|---|---|---|
| `GET /api/public/recruiter-invite/[token]` | `tests/unit/chat16-public-recruiter-invite-route-matrix-37.test.ts` (`PUBLIC-INVITE-ROUTE-37/40`) | Preview returns published invite only and never performs first-open/decision writes; disabled DB09 gate returns 503 before a preview lookup |
| `POST /api/public/recruiter-invite/[token]/opened` | same (`PUBLIC-INVITE-ROUTE-38..40`) | same-origin denial, dedicated first-open method returns persisted `recorded:false` idempotency, disabled deployment denies |
| `POST /api/public/recruiter-invite/[token]/not-hiring` and `unsubscribe` | same | POST-only decision handlers preserve exact non-hiring/unsubscribe outcomes; cross-origin and disabled gates prevent service calls |
| `POST /api/public/recruiter-invite/[token]/send-code` | same (`PUBLIC-INVITE-ROUTE-38/40/41`) | cross-origin denial, disabled OTP gate, malformed token rejected without revealing grant identity or sending mail |

Method-level tests mock external service writes, do not verify the real transactional lock/idempotency or delivery provider. No CI/TS/runtime suite was run in chat-16.


### 2026-10-19: global inbound-mail PATCH guard

| Route | Direct test | Behaviour |
|---|---|---|
| `PATCH /api/admin/inbound-mail/status` | `tests/unit/chat16-inbound-mail-status-json-cap-42.test.ts` (`INBOUND-TRIAGE-SIZE-42..44`) | Same-origin denies before reading JSON, strict 8 KB UTF-8 byte cap and 400/413 before loading even a privileged session, global Super Admin context forwarded to the existing compare-and-swap service, exact 200/409/503 persistence states, no-store private response |

The existing `changeInboundMailStatusForAdmin` permission matrix, status machine and database version token are unchanged. This fills the route body-size coverage gap without accepting untrusted actor IDs from the payload. These direct tests are authored, not run.

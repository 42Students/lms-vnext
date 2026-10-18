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

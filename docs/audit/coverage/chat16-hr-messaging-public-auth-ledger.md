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

## Remaining exhaustive-coverage work (explicitly OPEN)

- Functions not listed above across `src/modules/messaging/*`, `src/modules/notifications/*`, `src/modules/inbound-mail/*` and `src/modules/placements/*email*/*message*/*notification*` still need individual ledger rows with executed direct behavioural tests. Missing items include provider adapters, campaign dispatch, recipient persistence, inbound-mail mutations, and all side-effect service branches.
- Auth/public routes outside the four direct page imports and the existing login/invitation contract suite need executed page-level state coverage. New direct tests address four previously red matrix entries; the generated matrix still must be regenerated and checked.
- No claim of >90% branch coverage, PostgreSQL integration passing, complete route coverage, or production readiness. These require the local/cloud test harness and a real provider-enabled integration environment.

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

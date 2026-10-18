# Messaging exhaustive-coverage ledger (chat-16; in progress)

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

## 2026-10-18 additional direct behavioral coverage on chat-16 branch

**Verification state: authored and committed, but not executed in this GitHub-only session.** Provider-acceptance assertions mean API acceptance, not handset/inbox delivery. Never interpret this inventory as release certification.

| File | Export | Adversarial behaviour | Direct behavioural test | Runtime verification |
|---|---|---|---|---|
| `src/modules/notifications/exotel-sms.ts` | `createExotelSmsProvider` | HTTP 200 with rejected/unknown Exotel status or invalid SID is false; only affirmative accepted states true; bad phone/code and provider outage deny without logging OTP | `tests/unit/chat16-otp-provider-resilience-05.test.ts` | Not run |
| `src/modules/notifications/zeptomail-email.ts` | `createZeptoMailEmailProvider` | Reject malformed/CRLF recipient and quoted whitespace token before network; provider failure false; one POST for valid OTP | `tests/unit/chat16-otp-provider-resilience-05.test.ts` | Not run |
| `src/modules/notifications/zeptomail-email.ts` | `readZeptoMailConfig` | Config fallback and quoted token parsing | `tests/unit/chat16-messaging-boundaries-02.test.ts` | Not run here |
| `src/modules/messaging/providers.ts` | `createOutboundProvider` | Fail-closed credential and template checks, invalid recipients, SMS provider acceptance, no retry or exception on failed channel | `tests/unit/chat16-provider-channel-boundaries-07.test.ts` | Not run |
| same | `readOutboundProviderConfig` | Keeps specifically registered template map and exposes configured providers | `tests/unit/chat16-provider-channel-boundaries-07.test.ts` | Not run |
| `src/modules/messaging/service.ts` | `deliverBatch` | Provider exception isolated to the failed recipient; other sends continue; per-batch dedupe, recheck changed unsubscribe, fail-closed recheck outage, cap, allowlist, audit counts and preflight validation | `tests/unit/chat16-messaging-delivery-resilience-06.test.ts` | Not run |
| same | `validOutboundBatchId` | Invalid identifiers rejected before inserting or dispatching | `tests/unit/chat16-messaging-delivery-resilience-06.test.ts` | Not run |
| `src/modules/messaging/public-join-code-delivery.ts` | `deliverPublicRecruiterJoinCode` | Quoted empty credential never sends | `tests/unit/chat16-provider-channel-boundaries-07.test.ts` | Not run |
| `src/modules/placements/recruiter-message-email-provider.ts` | `sendRecruiterMessageDigest` | Quoted whitespace provider credential prevents an outbound request even with an otherwise valid signed Reply-To address | `tests/unit/chat16-provider-channel-boundaries-07.test.ts` | Not run |

### Permission matrix and state/side-effect checkpoints

| Principal or state | Required expectation | Evidence or gap |
|---|---|---|
| Active recruiter, sole verified college grant | May view only their own recruiter inbox and allowed placement-job notifications | `chat16-hr-account-journeys-04.test.ts`, `chat16-hr-notifications-privacy-02.test.ts` |
| Recruiter with multiple grants, no chosen college | Explicit CHOOSE_COLLEGE; no mixed-tenant thread preview | `chat16-hr-account-journeys-04.test.ts` |
| Removed recruiter, expired/disabled principal or forged college | Deny before DB or messages | `chat16-hr-account-journeys-04.test.ts` |
| TPO campaign recipient who opted out between queue and send | Must not send, but record suppression and audit counts | `chat16-messaging-delivery-resilience-06.test.ts` (in-memory); real DB race OPEN |
| Super Admin global inbound mail | Explicit platform scope and privileged permission; acting-college scope denied | `tests/unit/inbound-mail-admin-service.test.ts`; known historical failure, replay required |
| Wrong-tenant HR, TPO, learner or unauthenticated caller | Deny every route and mutation, never infer authorization from UUID | Additional route tests and PostgreSQL verification OPEN |
| Duplicate delivery in one dispatch call | One provider send and one SUPPRESSED entry | `chat16-messaging-delivery-resilience-06.test.ts` |
| Duplicate notification under parallel processes/retried workers | At-most-once claim + unique persisted dedupe key, idempotent notification event | **OPEN: no PostgreSQL race test; provider has no confirmed idempotency key** |
| Provider error during one recipient send | FAILED receipt, later recipients continue and aggregate audit records both | `chat16-messaging-delivery-resilience-06.test.ts` |
| Queue persistence/audit storage failure | No silently lost or fabricated notification, retry/rollback policies documented | **OPEN: PostgreSQL integration** |

### Unclosed route/page matrix (not disguised as passing tests)

- Public/login/auth: provider OTP boundaries now have direct test cases, but real OTP start/verify/resend route handlers still require browser and HTTP integration for disabled users, double attempts, stale tab, wrong-host tenant, expired session, loading, focus and mobile states.
- Recruiter messaging and notification pages: source-contract and model tests exist, but need executed render tests for errors, empty/loading/partial states, large lists, keyboard access and phone layout, plus tenant switching with concurrent sessions.
- TPO campaign dispatcher, receipts and inbound mail: production PostgreSQL unique constraints, transaction rollback, concurrent provider callbacks and cross-college object access need real DB harness (chat-17 fixture dependencies).
- Email gateway: upstream signature authentication, dedupe across tenant-scoped message IDs, replay expiration and in-app bell atomicity require provider + DB integration, not source text checks.
- Full exported-function and route-handler inventory across `src/modules/messaging`, `src/modules/notifications`, `src/modules/inbound-mail`, placement email/notification handlers and `src/app/api` remains OPEN. No >90% branch-coverage assertion.

## Public/auth direct route and page coverage added to this branch

| Route or source | Export | Security/error/UX behaviour under test | Test |
|---|---|---|---|
| `src/app/page.tsx` | `HomePage` | Actual React SSR output: OTP entry, email-only college, expired-session alert, unknown/unavailable tenant, platform marketing redirect, active session safe return URL, college branding | `tests/unit/chat16-public-login-page-render-08.test.ts` |
| `src/app/page.tsx` | `generateMetadata` | Host-resolved college title instead of untrusted search content | `tests/unit/chat16-public-login-page-render-08.test.ts` |
| `src/app/login/page.tsx` | `default`, `generateMetadata` aliases | Shared root page direct import plus existing alias source-contract check | `tests/unit/chat16-public-login-page-render-08.test.ts`, `tests/unit/chat16-public-auth-role-journeys-02.test.ts` |
| `src/app/api/auth/login/start/route.ts` | `POST` | Pre-handler guard rejection cannot send OTP, authenticated tenant injected from guard, no client college overrides, safe start audit | `tests/unit/chat16-otp-route-tenant-session-09.test.ts` |
| `src/app/api/auth/login/verify/route.ts` | `POST` | Expired/wrong OTP error emits no new session; successful sign-in rotates cookie, clears previous admin scope and membership; multi-college login does not auto-select | `tests/unit/chat16-otp-route-tenant-session-09.test.ts` |
| `src/app/api/auth/login/email/route.ts` | `POST` | Rate-limit rejection cannot resend; email fallback calls only server-scoped tenant attempt | `tests/unit/chat16-otp-route-tenant-session-09.test.ts` |

**Still pending:** Execute those direct route/page tests under Vitest and a real Next.js browser; test actual OTP form keyboard actions, interrupted network, rapid double-POST, browser back/forward state, 2FA, mobile focus, session expiry and cookie replay under PostgreSQL. No test execution or full route coverage is asserted by these authored additions.

## 2026-10-18 Projects-first notification hardening and direct route tests

Source-verified test authoring only. The cloud CI report `docs/orchestrator/unit-failures-latest.md` still lists historical chat-16 gap-register reconciliation failures; the 32 IDs, source file references, queue statuses, target lane, and citations were checked directly against current main and remain consistent. A new execution is required rather than weakening these acceptance checks.

| Area / boundary | Tested export or route | New behavioural assertions | Regression test | Status |
|---|---|---|---|---|
| Projects notification audience | `notifyActiveProjectMembers` | Fail closed on explicitly empty role set, do not expand to every project member; active membership and tenant/role SQL; deduplicate and exclude initiating actor | `tests/unit/PROJ-BREAK-chat16-notification-scope-01.test.ts` | Authored, unrun |
| Projects membership notices | `notifyProjectMemberships` | Deduplicate membership ids; current active college scope; exclusion and zero-membership no-op | Same | Authored, unrun |
| Projects notice links | `projectNoticeHref` | Encode hostile path/query/fragment content into a single route segment | Same | Authored, unrun |
| Project in-app notification writer | `deliverInAppNotificationInTransaction` | Reject persisted wrong-college recipient, duplicate recipient-event retry, disabled user, invalid link/event UUID, zero-recipient no-op | `tests/unit/PROJ-BREAK-chat16-notification-writer-14.test.ts` | Authored, unrun; PostgreSQL concurrency open |
| Inbound Super Admin list | `listInboundMailForAdmin` | Disabled user, wrong role, acting-college denial before storage; malformed filters, 50-row page, NEW global count, missing-table honesty | `tests/unit/chat16-inbound-mail-admin-journeys-10.test.ts` | Authored, unrun |
| Inbound status CAS | `changeInboundMailStatusForAdmin` | Wrong-role and scope denial, invalid version/type rejection, expected status+version in UPDATE predicate, no false success on 0-row update | Same | Authored, unrun |
| Inbound mail PATCH | `src/app/api/admin/inbound-mail/status/route.ts:PATCH` | Same-origin before login/body, tenant-bound actor, stale 409, unavailable 503, safe unauthorized response | `tests/unit/chat16-inbound-mail-route-11.test.ts` | Authored, unrun |
| Inbound global scope regression | `listInboundMailForAdmin` | Selected-tenant global administrator must be denied private platform mail; old contrary expectation repaired | `tests/unit/inbound-mail-admin-service.test.ts` | Authored, unrun |
| Recruiter mail digest | `sendRecruiterMessageDigest` | Disabled bridge, nonproduction allowlist, OTP template rejection, Reply-To host, HTTPS-only, safe HTML excerpts and last-three messages, single POST and network failure | `tests/unit/chat16-recruiter-digest-delivery-12.test.ts` | Authored, unrun |
| Recruiter inbound email | `acceptAuthenticatedRecruiterEmailReply` | Disabled feature, signature mismatch, exact-byte HMAC, rogue fields/addresses, quoted-only history, missing PostgreSQL migration and no transaction | `tests/unit/chat16-recruiter-inbound-bridge-boundaries-15.test.ts` | Authored, unrun |
| Public OTP form | `LoginForm` | Actual React server-rendered controls, a11y tab semantics, phone-only and email-only tenancy, consent | `tests/unit/chat16-auth-form-ssr-accessibility-13.test.ts` | Authored, unrun |

**Unclosed run-required gates:** real PostgreSQL transaction/rollback, simultaneous recipient dedupe across worker instances, exact provider acknowledgements and retry semantics, complete inbox TPO vs recruiter vs other college state transitions, browser keyboard/focus/phone flows and all producer/handler export rows. The Project notification role-filter guard closes one known product defect but must not be mistaken for full project module hardening (chat-14 owns its complete ledger).

## 2026-10-18 endpoint and model-matrix additions

| Module/function | Behaviour now asserted directly | Test | Verification |
|---|---|---|---|
| `src/modules/notifications/zeptomail-email.ts:isSecureMailProviderEndpoint` | Deny HTTP, embedded credentials and unparseable provider URL; permit configured HTTPS endpoint | `tests/unit/chat16-otp-provider-resilience-05.test.ts` | Author/test unrun |
| `src/modules/notifications/zeptomail-email.ts:createZeptoMailEmailProvider` | No outbound HTTP request when provider URL fails scheme/credential guard | Same | Author/test unrun |
| `src/modules/messaging/providers.ts:createOutboundProvider` | No campaign mail POST to malformed/plaintext/credentialed endpoint | `tests/unit/chat16-provider-channel-boundaries-07.test.ts` | Author/test unrun |
| `src/modules/messaging/public-join-code-delivery.ts:deliverPublicRecruiterJoinCode` | No recruiter code POST to HTTP loopback URL | Same | Author/test unrun |
| `src/modules/messaging/campaign-filter-model.ts:campaignFilterSchema, campaignFilterHref` | Search normalization, URL encoding, pagination/state/rogue-field bounds | `tests/unit/chat16-messaging-model-matrix-16.test.ts` | Author/test unrun |
| `src/modules/messaging/campaign-source-model.ts:campaignSourceSchema` | OTHER detail required; trim and size limits; unknown field denied | Same | Author/test unrun |
| `src/modules/messaging/engage-audience-model.ts:engageAudienceQuerySchema, summarizeEngageAudience` | Segment counts, unsubscribe, bounce, missing email and NOT_NOW suppression | Same | Author/test unrun |
| `src/modules/messaging/tpo-campaign-history-copy.ts:tpoCampaignHistoryTime, tpoCampaignHistoryStatus` | 18:40 UTC resolves to next-day 00:10 IST, known/unknown state copy | Same | Author/test unrun |
| `src/modules/messaging/unsubscribe-model.ts:issueUnsubscribeToken, verifyUnsubscribeToken, unsubscribeConfirmation` | Signed expiring HMAC, expiry exact boundary, tamper denial and GET-side-effect prohibition | Same | Author/test unrun |
| `src/modules/messaging/template-boundary-model.ts:isCampaignTemplateKey` | OTP/login/magic-link key fragments rejected, campaign keys allowed | Same | Author/test unrun |

**Not yet exercised with a full real environment:** multi-process exact-once, provider credential/DNS allowlist validation, mail SSRF from compromised deployment configuration, and unique receipt replay after a network timeout. Unit assertions alone do not prove production exactly-once delivery.

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

## TPO aggregate receipt permissions and export bounds (chat-16)

| Source function | Permissions and side effects asserted | Behavioural test | Verification |
|---|---|---|---|
| `listTpoMessagingHistory` | Reject learner, disabled TPO and absent membership before DB; scoped to college+organization and persisted TPO permission; page limit 25, provider acceptance truthfully labelled | `tests/unit/chat16-messaging-receipts-tenant-17.test.ts` | Authored, unrun |
| `exportTpoMessagingHistory` | Same role/scope check; up to 2,000 aggregate rows, never emails/recipient HMAC; explicit error if row 2,001 exists | Same | Authored, unrun |
| `getTpoMessagingBatch` | UUID validation, wrong-role denial, scoped college+organization detail lookup, no receipt drillthrough for unowned batch; return only aggregate statuses | Same | Authored, unrun |

Remaining integration: actual PostgreSQL query-plan/index verification for 2,000 receipts, snapshot consistency between aggregate batch and receipt rows, race on receipt updates, tamper/cross-college IDOR at HTTP routes, strict same-origin on exporting writes (GET reads must remain side-effect-free).

## 2026-10-18 account-journey and template-purpose gate follow-up

| Export / route | New direct regression | Purpose and failure modes covered | Execution |
|---|---|---|---|
| `src/modules/messaging/engage-audience-model.ts:summarizeEngageAudience` | `tests/unit/chat16-messaging-model-matrix-16.test.ts` | Source-level correction: whitespace and multiply-suppressed leads now use the exact send-policy disposition precedence; preview counts match suppression facts | Authored, unrun |
| `src/app/api/placements/recruiter/conversations/open/route.ts:POST` | `tests/unit/chat16-recruiter-conversation-route-18.test.ts` | Origin before identity; malformed body; expired session friendly response; missing recruiter; safe same-host thread redirect | Authored, unrun |
| `src/app/api/placements/recruiter/conversations/acknowledge/route.ts:POST` | Same | Origin before identity; expired session friendly response; missing recruiter; forged external return URL cannot redirect externally | Authored, unrun |
| `src/app/api/placements/recruiter/bell/route.ts:GET` | `tests/unit/chat16-hr-bell-http-19.test.ts` | Private no-store response; service outage maps to safe error; GET never acknowledges anything | Authored, unrun |
| `src/app/api/placements/recruiter/bell/route.ts:POST` | Same | Same-origin CSRF guard; caller context; idempotent zero-updated acknowledgment; revoked session denied | Authored, unrun |
| `src/modules/placements/recruiter-message-email-provider.ts:sendRecruiterMessageDigest` | `tests/unit/chat16-recruiter-digest-delivery-12.test.ts` | Reject authentication, OTP, password-reset, MFA and magic-link template keys even when not equal to currently provisioned OTP key | Authored, unrun |
| `src/modules/placements/recruiter-message-email-dispatch-service.ts:dispatchRecruiterUnreadMessageDigests` | Same | Invalid digest-template purpose disables worker before reading database messages or contacting mail provider | Authored, unrun |

The direct HTTP tests use mocked persisted services; PostgreSQL tenant-grant checks, actual mail-provider acceptance, web session expiry and browser redirect behavior must still pass independently. Every exposed failure should remain a safe status/code, never raw private message contents.

### Individual recruiter thread POST routes: additional direct tests

| Route/handler | Adversarial assertions | Direct test | Status |
|---|---|---|---|
| `src/app/api/placements/recruiter/conversations/[threadId]/reply/route.ts:POST` | Same-origin before actor lookup, bounded nonempty reply schema, expired-session safe 401 and no write; central safe error mapping for unexpected failures | `tests/unit/chat16-recruiter-conversation-route-18.test.ts` | Authored, unrun |
| `src/app/api/placements/recruiter/conversations/[threadId]/acknowledge/route.ts:POST` | Same-origin, UUID validation, safe 401 on expired actor, service call with authenticated actor only, redirect to first-party thread | Same | Authored, unrun |

These HTTP cases complement the existing `hrConversationQuerySchema`/tenant scope tests, but real-DB multi-college grant expiry, concurrent read receipts and message-send notification outbox recovery remain pending.

## Direct persistent recruiter TPO notification claims (2026-10-18)

| Export | Required security/idempotency contract | Evidence | State |
|---|---|---|---|
| `notifyTpoOfRecruiterMessage` | Sender, persisted message, thread recruiter and college must all match before reading body or inserting event; duplicate message ID is a single globally unique activity dedupe key; a replay does not insert more recipient bells; originating sender excluded | `tests/unit/chat16-recruiter-tpo-notice-once-20.test.ts` | Authored, unrun |
| Same, real PostgreSQL | Current active recruiter/TPO membership fixture delivers once and replay returns `{notified:0}`, with exactly one activity event under the dedupe key and one recipient bell | `tests/integration/recruiter-message-tpo-notifications.test.ts` | Conditional disposable-DB integration, unrun |

The current `unit-failures-latest.md` chat-16 entries refer to an older CI snapshot, while the current queue+canonical gap-register sources satisfy each recorded assertion. We preserved the original 32-ID historical invariant. CI rerun, role-revocation race and actual PostgreSQL lock contention remain open gates.

| `src/modules/messaging/tpo-campaign-send-policy.ts:campaignRecipientDisposition,planTpoCampaignRecipients` | Shared normalized validator rejects malformed, whitespace-only and dot-invalid email recipients before planning a recipient list, preserving the live suppressed counts and avoiding accidental outbound calls | `tests/unit/chat16-messaging-model-matrix-16.test.ts`, `tests/unit/t-s2-04-campaign-send-policy.test.ts` | Authored, cloud CI pending |

| `src/modules/auth/crypto.ts:mac,safeEqualHex,generateCode,generateToken,codeMac,contactFingerprint,sessionDigest,maskPhone,maskEmail` | Canonical 256-bit lowercase HMAC only, constant-time full-MAC comparison, purpose separation for OTP/contact/session, random code/token shape, masked personal contacts | `tests/unit/chat16-auth-crypto-boundaries-22.test.ts` | Authored, unrun |
| `src/modules/auth/http.ts:guardLoginRequest,ipTag,auditLogin` | Real guard behavior for CSRF, IP throttle, invalid JSON/schema, unknown/unavailable college host, server-derived tenant, opaque audit IP tags | `tests/unit/chat16-auth-guard-tenant-behavior-21.test.ts` | Authored, unrun |
| `src/modules/messaging/tpo-campaign-dispatch-service.ts:tpoCampaignDispatchReady,dispatchTpoCampaign` | Provider disabled on whitespace-only credentials, auth template aliases and invalid public origin; no DB claim while disabled | `tests/unit/chat16-tpo-campaign-config-gate-23.test.ts` | Authored, unrun |

## Public and authentication page rendering (additional live component cases)

| Page / source | Behavioural coverage added | Test | State |
|---|---|---|---|
| `src/modules/auth/tenant-branding.ts:getCollegeSignInName` | Exact active-college SQL scope, unknown/disabled college returns null, genuine storage outage propagates rather than presenting wrong name | `tests/unit/chat16-public-college-branding-24.test.ts` | Authored, unrun |
| `src/app/home/page.tsx:HomeMarketingPage` | Real React SSR marketing cards, mobile navigation, links to login/demo/privacy and truthful no-AI capability descriptions | `tests/unit/chat16-public-marketing-tenant-25.test.ts` | Authored, unrun |
| `src/app/company-join/[token]/page.tsx:CompanyJoinPage` | SSR correct COMPANY scope/token, preview outage recovery, no submission on read | `tests/unit/chat16-public-recruiter-join-pages-26.test.ts` | Authored, unrun |
| `src/app/college-join/[token]/page.tsx:CollegeJoinPage` | SSR correct COLLEGE scope/token, preview outage recovery, unavailable registration explanation | Same | Authored, unrun |
| `src/app/campaign-unsubscribe/[token]/page.tsx:CampaignUnsubscribe` | Distinct valid token, expired token and transient storage-outage render states; explicit POST-only opt-out and retry link | `tests/unit/chat16-public-unsubscribe-page-27.test.ts` | Authored, unrun |

Remaining page E2E coverage: interactive keyboard focus, phone viewport and real links across hosts, signed token origin/session semantics, consent POST handling, and rendering with actual provider and PostgreSQL fixture state are still open.

## Additional real-service tests and fixed provider gates (2026-10-18)

| Source function | Tests and explored boundaries | Execution status |
|---|---|---|
| `unsubscribeTpoCampaignRecipient` | `tests/unit/chat16-campaign-unsubscribe-auth-28.test.ts`: invalid and forged signature, too long, tampered token, no pre-auth DB access, missing schema, broken DB, replay already unsubscribed, wrong tenant/recipient denial, no duplicate notification | Authored; GitHub-only session, not run |
| `createExotelSmsProvider:sendOtp` | `tests/unit/chat16-otp-provider-resilience-05.test.ts`: blank API key/token, DLT entity/sender/template fail before outbound network | Authored; not run |
| `createOutboundProvider:send` | `tests/unit/chat16-provider-channel-boundaries-07.test.ts`: blank Exotel authentication, DLT entity/sender and template IDs fail before sending campaign SMS | Authored; not run |

**Published CI reconciliation:** two tests shown as failing by `docs/orchestrator/unit-failures-latest.md` in CI `ff6819dd` were directly observed green in completed GitHub Actions run `39120880707` on a later `main` commit. These failures require an orchestrator report refresh, not softened or deleted acceptance criteria. The overall CI run remains red due to other lanes.

## 2026-10-18 public delivery configuration and opt-out dispatch gates

| Export / path | Security and state behaviors covered | Test evidence | State |
|---|---|---|---|
| `tpoCampaignDispatchReady`, `dispatchTpoCampaign` configuration | An invalid/non-HTTPS/credentialed `ZEPTOMAIL_API_URL` cannot mark a draft as sending, and no database is queried; auth-only template, whitespace credential and malformed public origin also rejected | `tests/unit/chat16-tpo-campaign-config-gate-23.test.ts` | Authored, unrun |
| `createZeptoMailEmailProvider.sendOtpEmail` | Missing or whitespace-only OTP template fails before writing sensitive code to external provider | `tests/unit/chat16-otp-provider-resilience-05.test.ts` | Authored, unrun |
| `deliverPublicRecruiterJoinCode` | Insecure mail host, whitespace token or blank registered OTP template never dispatches a join code | `tests/unit/chat16-provider-channel-boundaries-07.test.ts` | Authored, unrun |

**Remaining production gates:** real provider configuration/acknowledgements, DB handoff race for opt-outs and queued campaigns, and UI double-submit/human testing. No fake green claims for these newly authored tests.

| `src/modules/placements/public-join/send-code-service.ts:lookupDeliveredJoinCompanyName` | Optional company lookup is active-company-only and registrable-domain scoped, handles invalid/free email and directory outages without throwing | `tests/unit/chat16-public-join-delivery-recovery-29.test.ts` | Authored, unrun |
| `src/modules/placements/public-join/send-code-service.ts:requestPublicJoinCode` | Fully mocked signed link, verified-IP/MX, rate checks, challenge persistence, actual `deliver` callback, then failed company-name lookup returns `{ sent:true, companyName:null }` without duplicate send or false failure | Same | Authored, unrun |

| `requestPublicJoinCode` anonymous preflight | Signed invitation token digest, scope, active organization/college, revocation and expiration, company work-domain match checked before performing MX resolution; the DB transaction repeats the checks under row lock, preserving revocation safety | `tests/unit/chat16-public-join-delivery-recovery-29.test.ts` | Authored, unrun |

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

### Direct TPO messaging receipt-history service tests

`tests/unit/chat16-messaging-receipt-history-service-16.test.ts` now invokes `listTpoMessagingHistory` and `exportTpoMessagingHistory` directly with an isolated mocked query builder. The four cases `messaging-receipt-history-16`–`19` enforce role and active-membership denials before any database access; strict bounded query filters; persisted-actor authorization before reading aggregate receipt counts; safe count pagination and honest `acceptedByProvider` semantics; and revoked-grant refusal. Transaction mocks are not equivalent to database race verification. Both services still need actual PostgreSQL tenant and concurrency acceptance; authored code remains unexecuted in this lane.

### Admin inbound-mail and TPO draft security regressions — 2026-10-18

- `tests/unit/chat16-inbound-mail-admin-page-16.test.tsx`: private page authorization invocation, invalid filters before data access, unavailable storage and page data projection.
- `tests/unit/chat16-inbound-mail-admin-versioning-16.test.ts`: global Super Admin role, invalid mutation inputs, unavailable table, stale compare-and-swap, and confirmed version increment.
- `tests/unit/chat16-inbound-mail-status-route-16.test.ts`: same-origin requirement, HTTP 409/503, private no-store success, shared safe error handler.
- `tests/unit/chat16-tpo-campaign-draft-live-role-16.test.ts`: live persisted permission checks for campaign draft history and detail; source now executes both reads inside a scoped authorization transaction.

All are authored **unit** cases and remain unexecuted until cloud CI; database concurrency and outbound provider delivery are not certified.

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

### Additional campaign dispatch preflight and unsubscribe route cases

- `tests/unit/chat16-tpo-campaign-dispatch-readiness-16.test.ts` directly invokes the TPO dispatch readiness service and its early authorization path with a mocked draft-storage registration check. Named cases `tpo-dispatch-readiness-16`–`19` cover verified dedicated non-OTP template, HMAC strength, HTTPS provider endpoint/public origin, unavailable storage, invalid IDs and non-TPO roles. A successful readiness check does **not** prove a campaign was sent, and no provider is contacted by these tests.
- `tests/unit/chat16-campaign-unsubscribe-ssr-pages-16.test.ts` adds direct public GET/confirmed-page coverage for invalid/expired links, temporary failures, two purpose scopes and the separate explicit confirmation form, with zero GET-side writes.

Neither suite has been executed. Provider, live PostgreSQL and browser behavior still require CI verification.

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

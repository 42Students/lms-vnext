# TPO campaigns, public recruiter links and settings/people coverage — chat-2

**Status:** PARTIAL / **blocked on execution and remaining service tests**. Branch `chatgpt/chat-2-b`, 2026-10-18. Unit test source assertions are identified explicitly and do **not** count as DB/service behavioral coverage. The suite was not run in this connector-only environment.

| Module | Exported function/schema | Test evidence | Gate |
| --- | --- | --- | --- |
| `src/modules/messaging/tpo-campaign-draft-model.ts` | `tpoCampaignDraftSchema` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/tpo-campaign-draft-model.ts` | `previewTpoCampaignText` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/tpo-campaign-draft-service.ts` | `tpoCampaignDraftStorageReady` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (source contract, DB role/tenant/races untested) |
| `src/modules/messaging/tpo-campaign-draft-service.ts` | `createTpoCampaignDraft` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (source contract, DB role/tenant/races untested) |
| `src/modules/messaging/tpo-campaign-draft-service.ts` | `listTpoCampaignDrafts` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (source contract, DB role/tenant/races untested) |
| `src/modules/messaging/tpo-campaign-draft-service.ts` | `getTpoCampaignDraft` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (source contract, DB role/tenant/races untested) |
| `src/modules/messaging/tpo-campaign-draft-service.ts` | `listTpoCampaignRecipientStatuses` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (source contract, DB role/tenant/races untested) |
| `src/modules/messaging/tpo-campaign-dispatch-service.ts` | `tpoCampaignDispatchReady` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (source contract, provider/timeout/partial batch untested) |
| `src/modules/messaging/tpo-campaign-dispatch-service.ts` | `dispatchTpoCampaign` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (source contract, provider/timeout/partial batch untested) |
| `src/modules/messaging/tpo-campaign-recipient-token.ts` | `resolveTpoCampaignRecipientSecret` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/tpo-campaign-recipient-token.ts` | `issueTpoCampaignRecipientToken` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/tpo-campaign-recipient-token.ts` | `verifyTpoCampaignRecipientToken` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/tpo-campaign-recipient-token.ts` | `matchesCampaignRecipient` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/tpo-campaign-recipient-token.ts` | `campaignUnsubscribeDecision` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/tpo-campaign-send-policy.ts` | `campaignRecipientDisposition` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/tpo-campaign-send-policy.ts` | `assertCampaignRecipientCap` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/tpo-campaign-send-policy.ts` | `planTpoCampaignRecipients` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/tpo-campaign-unsubscribe-service.ts` | `unsubscribeTpoCampaignRecipient` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (source contract, replay/wrong-tenant integration untested) |
| `src/modules/messaging/campaign-filter-model.ts` | `campaignFilterSchema` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/campaign-filter-model.ts` | `campaignFilterHref` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/messaging/template-boundary-model.ts` | `isCampaignTemplateKey` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (invalid sentinel integration only) |
| `src/modules/placements/tpo-public-join-link-model.ts` | `tpoPublicJoinLinkChangeSchema` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-public-join-link-model.ts` | `publicJoinLinkPath` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-public-join-link-model.ts` | `tpoPublicJoinLinkToggleSchema` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-public-join-link-service.ts` | `getTpoPublicJoinLinkStatus` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (source contract, no concurrent services) |
| `src/modules/placements/tpo-public-join-link-service.ts` | `changeTpoPublicJoinLink` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (source contract, no concurrent services) |
| `src/modules/placements/tpo-public-join-link-service.ts` | `setTpoPublicJoinLinkEnabled` | `tests/unit/chat2-ledger-campaign-public-link-and-settings.test.ts` | PARTIAL (source contract, no concurrent services) |
| `src/modules/placements/tpo-communication-settings-service.ts` | `getTpoCommunicationSettings` | `tests/integration/chat2-tpo-settings-cas-db.test.ts` | PARTIAL (DB timestamp CAS, service entrypoint untested) |
| `src/modules/placements/tpo-communication-settings-service.ts` | `updateTpoCommunicationSettings` | `tests/integration/chat2-tpo-settings-cas-db.test.ts` | PARTIAL (DB timestamp CAS, service entrypoint untested) |
| `src/modules/placements/tpo-settings-people-service.ts` | `tpoSettingsCollegeIdSchema` | `tests/unit/chat2-tpo-settings-people-break-01.test.ts` | PARTIAL (model/role evidence, live DB auth untested) |
| `src/modules/placements/tpo-settings-people-service.ts` | `getTpoPlacementTeam` | `tests/unit/chat2-tpo-settings-people-break-01.test.ts` | PARTIAL (model/role evidence, live DB auth untested) |
| `src/modules/placements/tpo-settings-people-service.ts` | `getTpoTrustedCompanies` | `tests/unit/chat2-tpo-settings-people-break-01.test.ts` | PARTIAL (model/role evidence, live DB auth untested) |
| `src/modules/placements/tpo-settings-read-model.ts` | `buildTpoTeamRoster` | `tests/unit/chat2-tpo-settings-people-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-settings-read-model.ts` | `summarizeTpoTeam` | `tests/unit/chat2-tpo-settings-people-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-settings-read-model.ts` | `buildTpoTrustedCompanies` | `tests/unit/chat2-tpo-settings-people-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/tpo-settings-read-model.ts` | `buildTpoTrustedDomains` | `tests/unit/chat2-tpo-settings-people-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/public-page/publication-view-model.ts` | `publicPlacementSettingState` | `tests/unit/chat2-tpo-last-third-policy-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/placements/public-page/optional-read-model.ts` | `readOptionalPublicPlacementData` | `tests/unit/chat2-tpo-last-third-policy-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/verification/tpo-queue-server-model.ts` | `tpoVerificationQuerySchema` | `tests/unit/chat2-tpo-last-third-policy-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/verification/tpo-queue-server-model.ts` | `tpoVerificationStatuses` | `tests/unit/chat2-tpo-last-third-policy-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/verification/tpo-queue-server-model.ts` | `tpoVerificationHref` | `tests/unit/chat2-tpo-last-third-policy-break-01.test.ts` | UNIT WRITTEN |
| `src/modules/verification/tpo-queue-server-model.ts` | `tpoVerificationWaitingDateRange` | `tests/unit/chat2-tpo-last-third-policy-break-01.test.ts` | UNIT WRITTEN |

## Verified-by-design code protections to execute

- **Campaign recipient safety:** source-specific HMAC key resolved identically in draft and dispatch, token scope includes college/campaign/recipient IDs, unsubscribe is transaction-scoped and replays are rejected, opted-out/no-email/bounced/Not Now recipients are suppressed, dispatch single-claims DRAFT and QUEUED. Existing model-level tests are authored; do not claim provider E2E delivery without a sandbox.
- **Public join links:** authenticated active membership, college-scoped DB lookup, 32 random token bytes hashed at rest, one-time URL, `expectedLinkId` on replace/toggle to reject a stale browser tab. Same-state toggles are no-ops with no double audit. Client guard blocks duplicate network mutation while one is in flight. Need two-session DB race tests with real migration.
- **Communication settings:** college row lock and exact expected timestamp check, `greatest(clock_timestamp(),date_trunc('milliseconds',updated_at) + interval '1 millisecond')` monotonic CAS to reject stale duplicates. PostgreSQL SQL regression newly authored; service invocation test missing.
- **TPO people:** only ACTIVE platform users and college memberships, explicit TPO_ADMIN/faculty/student coordinator assignment, student dated duties, explicit trusted domain records. Pure projection tests authored; permission-scoped live service tests missing.
- **TPO last-third (selected):** verified query strict bad-filter refusal, IST waiting date range, URL-safe filter encoding, honest small-cohort public statistics and optional-read failure privacy model. Other routes remain open.

## Last-third route QA checklist (incomplete)

The following routes are examples of unresolved **browser/role and responsive acceptance**, not proof of coverage: `/tpo/reports/*`, `/tpo/requests`, `/tpo/settings/*`, `/tpo/students/*`, `/tpo/team/*` and `/tpo/verification`. The page inventory is `docs/orchestrator/ui-ux/pages-tpo.md`. For **every** last-third route, test loading, empty, error, partial, denied, and phone experiences, including expired auth and scoped links. Live browser checks and DB-backed auth/tenant tests are not available in this workspace.

## Release blockers (do not mark complete)

1. Run `tsc`, Vitest, the real PostgreSQL harness with `TEST_DATABASE_URL`, and the independent service/concurrency tests.
2. Finish direct integration and behavior tests for all PARTIAL service functions; prove wrong-tenant/expired-session denial and atomic audit/recipient state.
3. Finish last-third **per-page** six-state responsive coverage and real export failure tests.
4. Validate public join link optimistic `expectedLinkId` compatibility with all known UI/route callers and error recovery in a browser.

This ledger is deliberately explicit about gaps; source assertions and compilation alone are not behavioral certification.

## Pass B follow-up (2026-10-18)

- `src/modules/placements/public-unsubscribe-preview-service.ts` now uses `resolveTpoCampaignRecipientSecret(process.env)` so the read-only link preview recognizes the same signed tokens as the dispatch/unsubscribe POST path, even when the canonical key supersedes a legacy alias.
- Updated `chat2-public-join-disabled.test.ts` to exercise required optimistic `expectedLinkId` and reject forged company inputs. Updated `chat2-unsubscribe-graceful.test.ts` to protect idempotent **signed** retries while refusing unknown/unverified tokens rather than showing a false unsubscribed confirmation.
- Added `tests/unit/chat2-tpo-last-third-route-matrix.test.ts` covering all 42 final-slice page **source** contracts, authorization inherited from `/tpo/layout.tsx`, loading/retry errors, and reports/settings routes. Individual interactive browser state journeys remain pending.
- Every test and route is still subject to cloud typecheck/unit/DB verification before a green ledger claim.

## Pass B – public link actual-handler tests

- `tests/unit/chat2-tpo-public-link-route-journeys-break-05.test.ts` imports the actual public join link create, toggle and status handlers. Cases cover CSRF denial before context load, session-derived actor scope, safe stale/expired/tenant failure response, forged scope query rejection, no bearer token in status response, and no-store caching. The service implementation remains the tenant-level enforcement boundary; mocked-handler tests alone are not DB actor/tenant certification.
- Canonical HMAC resolution in unsubscribe read preview now matches the POST and campaign dispatch secret. `chat2-unsubscribe-graceful.test.ts` rejects unsigned unknown links while accepting idempotent signed opt-outs.

## Cloud unit failure repair: TPO last-third page inventory

- `tests/unit/chat2-tpo-last-third-route-matrix.test.ts` originally parsed `(src/app/(authenticated)/...)` using the first right parenthesis, accidentally storing `src/app/(authenticated` as every file path. This caused every 42-page source test to fail even though the page guards remained in place.
- Commit `f169e8b` now derives the **actual full path** from the authoritative `docs/orchestrator/ui-ux/pages-tpo.md` entries, preserves the exact 42-route slice, rejects malformed inventory lines and still enforces per-report authorization and per-settings page contracts. No route assertion was skipped or removed.
- The deployed browser and cross-account session checks remain necessary: successful source-level assertions alone do not certify interactive user journeys.

## Duplicate-selector authorization and UI contracts

- `TPO-settings-audit-55` status GET now refuses repeated `scope`/`companyId` and extra `collegeId` parameters before the authenticated read handler executes; coverage in `tests/unit/chat2-tpo-public-link-route-journeys-break-05.test.ts`.
- Recruiter access settings also rejects duplicate grant status, page or query filters and retains the exact legacy heading **Recruiter access** plus an actionable reset, covered in `tests/unit/chat2-tpo-public-link-settings.test.ts`.
- `tests/unit/chat2-tpo-round-contracts-break-11.test.ts` adds model-level strictness for confirmed/bulk result staging, reserved waitlist ranks, 25-entry cap, forged college fields, roster counting, attendance wording and CSV formula safety; cloud CI and DB/service integrity gates remain open.

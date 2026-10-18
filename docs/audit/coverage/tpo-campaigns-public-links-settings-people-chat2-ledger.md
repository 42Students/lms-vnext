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

## TPO last-third GET ambiguity closure — 2026-10-18

- `UX-tpo-LAST-THIRD-01`: `/tpo/verification` rejects repeated `tab`, `kind`, `page`, `pageSize`, `batchId`, `branchId`, `waitingState`, `waitingSince` and `search` parameters, plus unexpected cross-tenant identity selectors, before `getTpoVerificationQueue`. The model `parseTpoVerificationParams` returns `null` instead of silently selecting the first value; the page retains the established friendly Reset and no-records-loaded state. Named test in `tests/unit/chat2-tpo-last-third-policy-break-01.test.ts`.
- `UX-tpo-LAST-THIRD-01`: `/tpo/students/requests` likewise rejects repeated or unexpected `status`/`search`/`page`/`pageSize` fields before loading the scoped request list, preserving the explicit invalid-filter recovery. `tests/unit/chat2-tpo-student-requests-url-break-14.test.ts`.
- These are bounded source/model tests **authored but not executed**; browser, expired-session, large-table mobile QA and disposable PostgreSQL role/tenant tests remain open. Neither change claims that all 42 last-third pages have completed six-state interactive verification.

## Report-selector ambiguity hardening (2026-10-18)

- `UX-tpo-LAST-THIRD-01`: all **14** final-slice TPO reports under `/tpo/reports/{by-branch,by-company,ctc,failure-reasons,intelligence,joining-followups,joining-status,leads,offers-acceptance,offers-expiry,placed-branch,placement-summary,season-pipeline,unplaced}` now refuse duplicate query parameters **before** report-service retrieval. The shared `tpoReportHasAmbiguousFilters` model blocks contradictory `seasonId`, `jobId`, `page`, filters or forged repeated selectors instead of retaining only the first string.
- `TpoReportInvalidFilters` renders an accessible `role="alert"` and a single-route Clear filters recovery link, never substituting a zero count or leaking a raw report error. All 14 named route checks plus duplicate-input model checks are in `tests/unit/chat2-tpo-reports-duplicate-params-break-15.test.ts`.
- The assertion is bounded: it establishes **source path and pure-model evidence**, **not** a browser session/tenant integration test, nor proof that the downstream reports reject every possible malformed single-valued filter. These remain release gates, as do direct tests for TPO campaigns, public links, settings people and cross-writer PostgreSQL races. Tests are awaiting cloud CI.

## Chat-2 post-merge corrections and people/settings behavioral coverage — 2026-10-18

The main failure snapshot predated the shared ZeptoMail provider configuration and persisted recruiter-identity checks. The source-only dispatch assertion now verifies `readZeptoMailConfig()`, nonempty token, secure endpoint and distinct OTP template; it no longer assumes the implementation reads `ZEPTOMAIL_TOKEN` directly. It is **not** a real provider-dispatch test.

| Model/surface | New directly exercised behavior | Test |
| --- | --- | --- |
| `tpo-settings-read-model.ts`: `tpoSettingsCollegeIdSchema`, `buildTpoTeamRoster`, `summarizeTpoTeam` | Reject forged colleges; deduplicate membership roles/duties; exclude inactive actors; truthful counts | `tests/unit/chat2-tpo-people-settings-ledger.test.ts` |
| `tpo-team-people-sort-model.ts`: `sortTpoPeople` | Separate workload/overdue/name ordering without mutating the caller | `tests/unit/chat2-tpo-people-settings-ledger.test.ts` |
| `tpo-settings-read-model.ts`: `buildTpoTrustedCompanies`, `buildTpoTrustedDomains` | Never trust global company-domain metadata as college authorization; canonicalize and dedupe persisted explicit domains | `tests/unit/chat2-tpo-people-settings-ledger.test.ts` |
| `tpo-communication-change-model.ts`: `tpoCommunicationChangeSchema`, `tpoCommunicationChanges`, `tpoCommunicationUpdateAlreadyApplied` | Strict section/version controls, exact changed fields, idempotent retry/no-op comparison | `tests/unit/chat2-tpo-people-settings-ledger.test.ts` |
| `tpo-workspace-access-model.ts`: `canOpenTpoWorkspace`, `hasTpoTooling` | Real role matrix, revoked/disabled membership, current college/organization and conflicting Super Admin selection | `tests/unit/chat2-tpo-last-third-auth-matrix.test.ts` |
| `recruiter-job-visibility-model.ts`: `isRecruiterJobVisible` | Active grant AND central policy AND exact authenticated recruiter user ID; denies impersonation, wrong college/relationship | `tests/unit/HR-BREAK-authorization-01.test.ts` |

**Not verified:** production provider calls, DB integration and competing writers, browser last-third pages’ loading/partial/error/phone states. All tests authored, not run. Do not interpret `UNIT WRITTEN` as CI passed.

## 2026-10-18 direct service behavior follow-up

| Entry point | Unit evidence added | Remaining gate |
| --- | --- | --- |
| `getTpoPublicJoinLinkStatus`, `changeTpoPublicJoinLink`, `setTpoPublicJoinLinkEnabled` | `tests/unit/chat2-public-link-service-security-races.test.ts`: tenant/role/disabled-session denial before DB, fail-closed unavailable storage, strict company/link CAS IDs, scoped college-admin read | Token rotation competing DB writers, real audit and one-time display |
| `getTpoCommunicationSettings`, `updateTpoCommunicationSettings` | `tests/unit/chat2-tpo-communication-settings-service-cas.test.ts`: strict shape, actor denied, unregistered storage, revocation before mutation, stale CAS, identical retry no-op, successful audit | PostgreSQL transaction/rollback and real session integration |

All tests authored and committed; **not executed**. Existing partial ledger rows stay PARTIAL until full database, role and UI verification.

## TPO last-third actual server-page state tests — 2026-10-18

The 42-route source matrix is complemented by **direct async server-page behavior** on selected high-risk pages (not claimed for all 42):

| Page(s) | Test | Tested states |
| --- | --- | --- |
| `/tpo/settings/public-link` | `tests/unit/chat2-tpo-last-third-settings-render.test.ts` | TPO-only authorization vs College Admin/learner/missing membership, college-bound status lookup, pending public-link state, legacy title |
| `/tpo/settings/blocked-dates` | `tests/unit/chat2-tpo-last-third-settings-render.test.ts` | truthful unregistered-storage message vs ready editor, persisted timestamp ISO value, titled page |
| `/tpo/reports/by-branch` | `tests/unit/chat2-tpo-reports-server-page-states.test.ts` | repeated selectors denied before scoped service, learner/admin denial, selected college + season/job bound, no-season empty state |
| `/tpo/reports/ctc` | `tests/unit/chat2-tpo-reports-server-page-states.test.ts` | repeated selectors denied before private CTC report lookup; learner denied before read |

**Remaining:** 38 other pages require equivalent executable per-page states; the existing 42-route inventory/source matrix is not a substitute. Loading/error boundary, mobile/browser and database integration remain pending CI. This table records authored tests only, not passed coverage.

### Additional staff-directory server-page tests

- `tests/unit/chat2-tpo-settings-team-trusted-page-behavior.test.ts`: `UX-tpo-LAST-THIRD-01` validates direct TPO-only role gates before querying team and trusted company relationships; verifies distinct unavailable faculty/student coordinator sources and trustworthy no-team empty state; verifies explicit trusted-domain storage failure stays distinct from company relationship flags.
- `tests/unit/chat2-tpo-reports-server-page-states.test.ts`: role/duplicated-filter protection and the honest no-season state for TPO branch and CTC reports.

Page-state coverage is still PARTIAL; these additions do not certify the remaining last-third pages or accessible real-browser behavior. Cloud CI has not yet executed the new tests.

### Whole final report slice: executable server denial states

`tests/unit/chat2-tpo-report-all14-page-denial.test.ts` now imports and invokes the **14 actual TPO report server pages** listed in `chat2-tpo-reports-duplicate-params-break-15.test.ts`. For every one: missing membership, College Admin, Learner, disabled TPO identity, and duplicate season selectors are checked ahead of a report database call. Each page's rejected state is validated through the shared redirect or the returned `TpoReportInvalidFilters` route identity. This is **70 per-route behavioral cases**, plus inventory uniqueness. It complements the old static 14-route matrix; no report data fixtures or route were weakened. 

**Still pending**: each report's successful populated/empty/partial/error/browser visual behavior, eventual post-merge CI execution and real database isolation. Server-only role tests do not certify those states.

## 2026-10-19 additional recruiter grant service concurrency coverage

| Export | PostgreSQL behavioural test | Coverage and limits |
| --- | --- | --- |
| `changeTpoRecruiterGrant` | `tests/integration/db09-tpo-recruiter-grant-write.test.ts` — `TPO-settings-recruiter-grant-CAS-01` | Real grant → extend → stale retry rejected → second extension → revoke → stale revocation rejected; monotonic millisecond-visible revision and exactly four persisted grant audit events. Service now uses monotonic `updatedAt` on EXTEND and REVOKE to prevent same-millisecond double extension. Tests written, **not executed**. |
| `tpo/settings/team`, `tpo/settings/public-link` | `tests/unit/chat2-tpo-last-third-runtime-settings-pages.test.tsx` | Direct server component invocation, TPO role denial before data query, real rendering empty/partial and safe link readiness, mobile classes and no leaked team contact fields. Browser journeys pending. |

All other campaign, people and link service rows remain partial until real PostgreSQL isolation/rollback and provider/browser verification. No CI was run by this lane.

## 2026-10-19 direct campaign service denial tests

`tests/unit/chat2-campaign-draft-dispatch-service-denial.test.ts` invokes actual `createTpoCampaignDraft`, `listTpoCampaignDrafts`, `getTpoCampaignDraft`, `listTpoCampaignRecipientStatuses`, `dispatchTpoCampaign`, and `tpoCampaignDispatchReady` with mocked runtime boundaries. It covers wrong role, revoked/disabled/missing membership, malformed campaign IDs, tenant-field injection, duplicate/empty lead selection, auth/OTP template rejection, unregistered draft storage, disabled provider configuration, and no database/provider call on those denied paths. These are **direct behavioural unit tests written, not executed**. Sender acceptance/failure, external provider network, two-session draft claim, real DB CAS and audit still require integration testing. No claim of complete campaign delivery.

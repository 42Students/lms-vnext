# Placements core coverage ledger — chat-5

Branch: chatgpt/chat-5-b. Status: **NOT RELEASE-CERTIFIED**. This entry records source-written tests, not executed passes. The connected GitHub tool can write files and commits but does not provide a runnable checkout, Vitest runner, isolated PostgreSQL database, or interactive browser. Existing 'placements-chat5-core-ledger.md' is the predecessor and is also partial.

## State machines first: evidence versus outstanding risks

| Gap IDs | Function(s), model, or process | Coverage source and assertion | Remaining validation |
|---|---|---|---|
| PLACEMENTS-LIFECYCLE-01..05 | evaluateTpoDriveLifecycle, tpoDriveLifecycleSchema, hasSecureEmployerPortalUrl, tpoDriveReadinessMessage | chat5-placements-core-state-machines.test.ts; state/precondition/reopen matrix and strict external URLs | DB race for publish/close/reopen, one audit event |
| PLACEMENTS-CANCEL-SM-01/02 | evaluateTpoDriveCancellation, isIssuedOfferCancelable, tpoDriveCancelSchema | **new** chat5-placements-core-extended-state-machines.test.ts; closed/inactive/changed impact, confirmation, CAS, accepted offer protection | Rollback and notification on cancellation |
| PLACEMENTS-SEL-SM-01/02 | recordSelectionsSchema, releaseSelectionsSchema, summarizeSelectionRelease | **new** extended-state-machines test; duplicate ID/invalid amount/forged scope, confirmed release with recorded version on each item | Competing TPO release + DB record history + notification |
| PLACEMENTS-WAIT-SM-01/02 | tpoWaitlistPromotionSchema, waitlistPreviewToken, getTpoWaitlistPreview, offerToNextWaitlisted | **new** extended-state-machines and chat5-tpo-account-breakit tests; corrected lowercase hex token schema and mapped post-issue race to domain stale-preview error | **HIGH RISK** row lock plus seat reservation and offer issuance span two DB transactions; exactly-once and crash recovery unverified |
| PLACEMENTS-OFFER-SM-01/02 | canRecordTpoOfferAction, tpoOfferLifecycleInputSchema | **new** matrix of five actions × six statuses × four joining states plus strict Zod tests | Duplicate accept/release, role check, history CAS and expiry competition |
| PLACEMENTS-HELD-01..04 | canReleaseAnotherHeldOffer, canAddPlacementHeldOffer, verifiedExternalHeldOffers, canShowLearnerSelfApply | Existing core-state-machines test: held limits, external verification, self-apply gates | Concurrent offers and current college policy |
| PLACEMENTS-EXPIRY-01..03 | isPlacementOfferResponseExpired, isPlacementOfferExpiredAt, isIssuedPlacementOfferDue, selectDuePlacementOfferIds, minimumOfferResponseDeadline | Existing core-state-machines tests: exact cutoff, Sunday IST, sweep eligibility | sweepExpiredPlacementOffers worker locks, audit/notification, scheduler |
| PLACEMENTS-CASCADE-01..03 | parsePlacementCascadeId, shouldKeepPlacementCascadeSibling, assertUndoablePlacementCascadeSnapshot | Existing core-state-machines tests: dream/internship/uplift and forbidden exact undo | Atomic sibling rollback, audit, mixed accepted state |
| PLACEMENTS-EXTERNAL-01..04 | nextExternalOfferStatus, isVerifiedExternalPlacement, countVerifiedExternalPlacements, externalOfferAnnualCtcInr | Existing external-offers-and-deadlines test: all legal/illegal transitions and decimal precision | Real reviewer tenant, historical retention, concurrent review |
| PLACEMENTS-DEADLINE-01 | isPlacementApplicationDeadlinePassed | Existing external-offers-and-deadlines test: before/at/after boundary | Concurrent apply vs closing drive |
| PLACEMENTS-RETENTION-01/02 | collegeApplicationRetentionCutoff; getCollegeApplicationRetentionReport | **new** finite 180-day cutoff, read-only query source restrictions incl. both college joins, withdrawal/rejection and 200-row cap | Actual retention DB query, audit/provenance and tenant wrong-ID tests |
| PLACEMENTS-JOIN-SM-01 / PLACEMENTS-JOINING-FOLLOWUP-01 | projectTpoJoiningTracker; projectTpoJoiningFollowups; tpoJoiningFollowupCsv | **new** extended-state-machines and retention-and-joining-followups tests: ACCEPTED only; date-missing not overdue; distinct offers; explicit JOINED; CSV truncation | Real correction + actor/session revocation |
| PLACEMENTS-ROUND-VIEW-01/02 | projectTpoRoundResultTable, filterTpoRoundResultRows, tpoRoundResultViewSchema | **new** chat5-tpo-second-third-behavior.test.ts; prefiltered shortlisted/submitted roster, applied immutability, TALK/CANCELLED/non-live denial | 500+ roster and stage/apply DB race |
| PLACEMENTS-OFFERS-VIEW-01/02 | offerRegisterQuery, projectOfferRegister, tpoDriveOfferRegisterCsv | **new** second-third behavioural test: exact offers/joining counts, pagination, same CSV filters, formula neutralization | Tenant export API, long-list truncation, privacy |
| PLACEMENTS-OFFER-EVIDENCE-01 | tpoOfferEvidenceQuery, projectOfferEvidence | **new** second-third behavioural test: validated IDs, persisted chronological events, absence not inference | Wrong-job offer IDOR and stale response |

## Mutations, permissions, idempotency and audit

| Source | Evidence added/existing | Not proven |
|---|---|---|
| offer-service.issuePlacementOffer | Existing tests/integration/placements-p8-offers.test.ts: issuance, authorized actor, retry, audit and learner notification; PLACEMENTS-IDOR-01 foreign college denial | Concurrent issuers and delivered notification dedupe on real DB |
| offer-service.actOnPlacementOffer | Existing P8 integration: accept/decline/reject expired; denial of TPO self-accept | Sweeper-versus-response serialization and expired session |
| offer-service.recordPlacementJoiningOutcome | Existing P8: idempotent JOINED retry does not append duplicate history; **fixed TypeScript assertion to offerId**, PLACEMENTS-JOINING-01 | Concurrent corrections and role revocation |
| application-service.applyToPlacementJob | Existing P8 integration submission and deadline pure tests | Concurrent repeated apply, cross-college user session |
| screening-service.decidePlacementScreening | Existing P8 shortlist plus revoked shortlist offer refusal | All invalid transitions and audit |
| round-service.createPlacementRound / actOnPlacementRound | Existing P8 completed-round path | All state transitions, venue overlap, stale reassignment |
| result-service.stagePlacementRoundResult / applyPlacementRoundResult | Existing P8 stage/apply path; new view matrix forbids editing APPLIED | Transaction rollback, 500+ cap, wrong job/round |
| tpo-drive-selection-service and selections route | Existing chat5-placements-ux-workflows.test.ts; new selection Zod tests and TPO-2ND-PAGE source contracts | Multi-user race, 403, 409, exactly-one release event |
| tpo-waitlist-promotion-service and waitlist route | New token and scoped row-lock source contracts and safe error code | **High risk** cross-transaction issuance and capacity races |
| tpo-joining-tracker-service and joining route | New ACCEPTED-only projection and no-evidence page contract; **new** joining-followup model counts/state/date/CSV truncation and formula-safety tests | Other-college data isolation and real correction |
| placement-offer-expiry-sweep-service | Existing pure expiry evidence; implementation uses skipLocked | Scheduler, worker race, stale offer response, audit |
| college-retention-report-service | **new** retention cutoff policy and joining followups, plus source predicate/role/tenant assertions in chat5-placements-retention-and-joining-followups.test.ts | **OPEN** persisted tenant scope and report/offer/joins historical DB evidence |
| TPO first/second third source routes | Existing chat5-ux-tpo-middle-third.test.ts, 42 page contracts; new ten second-third page checks | Live API deny/error/loading and browser viewport/click tests |

## TPO account BREAK-IT matrix

| Threat | Test | Present behaviour and remaining check |
|---|---|---|
| Bad input | TPO-BREAK-input-01, TPO-BREAK-transport-01 | Selection Zod rejects duplicate/invalid/forged fields; body parser bounds JSON streams. Live API malicious input remains open. |
| Double submits | TPO-BREAK-race-01, TPO-batches-40 | **Fixed** eligibility import preview and commit using synchronous useRef in-flight lock and finally release; browser rapid-double-click + lost-response tests open. |
| Stale tabs | TPO-BREAK-stale-01, PLACEMENTS-SEL-SM-02 | Preview token reflects changed job/results; releases need recorded version; DB compare-and-swap race open. |
| Wrong tenant / role | TPO-BREAK-tenant-01 and existing PLACEMENTS-IDOR-01 | Read actor, membership, college, role and permission preflight. TPO wrong-college IDOR against seeded PostgreSQL remains open. |
| Expired session | TPO-BREAK-session-01, TPO-BREAK-origin-01 | HTTP 401/403/409/500 client-safe messages; same-origin checks on both import writes; mid-flight session revocation open. |
| History, audit, notifications | Existing PLACEMENTS-JOINING-01 and issuePlacementOffer integration | Verify exactly once, correct college attribution, immutable audit after failures. |

## Page-level and UX audit

Existing chat5-ux-tpo-middle-third.test.ts inventories the TPO second-third 42 routes with page copy and basic recovery boundaries; new chat5-tpo-second-third-behavior.test.ts deepens selections, waitlist, offers, offer evidence, joining, round results, closeout, applications export, lifecycle list and recorded-outside. The after-college page test was updated to protect 25-row pagination and first-300-row disclosure. The last-third cross audit and existing docs/design-system/audits/UX-ROLLOUT-AUDIT-tpo-last-chat-5.md cover 42 routes; three missing dynamic-route findings were appended and note file lookup corrected to preserve membershipId/threadId capitalization. Browser/mobile/screen-reader execution remains pending.

## Release gate (not complete)

Do not mark this ledger complete until CI runs npm run typecheck; Vitest on all new/changed chat-5, TPO-batches and P8 tests; the full suite; isolated PostgreSQL adversarial concurrency, audit/event/notification checks; and 320/360/390px real-browser role journeys. There are **967 root files** under src/modules/placements on the current source listing, so this ledger is an enumerated core slice, **not an exhaustive register of every exported function or route handler**. Missing cases must remain explicit and unaccepted for IIT Dharwad.

## Source-scanned export inventory — 24 core files

Inventory source: direct GitHub reads of the 24 named production placement files at this branch head. The symbol list contains exported runtime declarations (functions, constants and classes) only; types, other modules, other tests and HTTP route handlers are not inventoried here. A checkmark records only a **direct symbol reference in the eight sampled current lane test files**, which is **not evidence that a test was executed or that every branch is asserted**. A circle denotes no direct reference among these eight, not necessarily a missing test across all project suites.

| Module | Runtime export names (✓ direct name reference; ○ not referenced in sampled tests) | Coverage count |
|---|---|---|
| application-service.ts | ○ resolveExistingApplication, ○ canReapplyWithdrawnPlacementApplication, ✓ applyToPlacementJob, ○ listOwnPlacementApplications, ○ listPlacementJobApplications, ○ getPlacementApplication, ○ canSelfWithdrawPlacementApplication, ○ withdrawPlacementApplication | 1 / 8 |
| job-service.ts | ○ listPlacementJobs, ○ getPlacementJob, ✓ createPlacementJob, ○ updatePlacementJob, ✓ publishPlacementJob, ○ mustWithdrawPendingOfferOnDriveStop, ○ closePlacementJob, ○ canCancelPublishedPlacementJob, ○ cancelPlacementJob, ○ archivePlacementJob | 2 / 10 |
| offer-service.ts | ✓ issuePlacementOffer, ✓ actOnPlacementOffer, ○ previewOwnOfferAcceptanceImpact, ✓ recordPlacementJoiningOutcome, ✓ listOwnPlacementOffers, ○ listPlacementJobOffers, ○ listPlacementOfferCandidates | 4 / 7 |
| screening-service.ts | ○ listPlacementScreeningQueue, ○ getPlacementScreening, ✓ decidePlacementScreening | 1 / 3 |
| result-service.ts | ○ listPlacementRoundResults, ✓ stagePlacementRoundResult, ✓ applyPlacementRoundResult, ○ listOwnAppliedPlacementResults | 2 / 4 |
| round-service.ts | ○ listPlacementRounds, ○ getPlacementRound, ✓ createPlacementRound, ○ updatePlacementRound, ✓ actOnPlacementRound, ○ getTpoRoundReorderReadiness, ○ reorderPlacementRounds | 2 / 7 |
| tpo-drive-lifecycle-model.ts | ✓ tpoDriveLifecycleSchema, ✓ hasSecureEmployerPortalUrl, ✓ evaluateTpoDriveLifecycle, ✓ tpoDriveReadinessMessage | 4 / 4 |
| tpo-drive-cancel-model.ts | ○ tpoDriveCancelImpactSchema, ✓ tpoDriveCancelSchema, ✓ evaluateTpoDriveCancellation, ✓ isIssuedOfferCancelable | 3 / 4 |
| tpo-drive-cancel-service.ts | ○ getTpoDriveCancelPreview, ○ cancelTpoDriveWithPreview | 0 / 2 |
| tpo-drive-selection-model.ts | ✓ recordSelectionsSchema, ✓ releaseSelectionsSchema, ✓ summarizeSelectionRelease | 3 / 3 |
| tpo-drive-selection-service.ts | ○ countUnreleasedTpoSelections, ✓ getTpoSelectionWorkspace, ○ recordTpoDriveSelections, ○ verifyAndReleaseTpoSelections | 1 / 4 |
| tpo-waitlist-promotion-model.ts | ✓ tpoWaitlistPromotionSchema, ✓ waitlistPreviewToken | 2 / 2 |
| tpo-waitlist-promotion-service.ts | ✓ getTpoWaitlistPreview, ○ offerToNextWaitlisted | 1 / 2 |
| tpo-joining-tracker-model.ts | ✓ tpoJoiningTrackerQuerySchema, ✓ projectTpoJoiningTracker | 2 / 2 |
| tpo-joining-tracker-service.ts | ✓ getTpoJoiningTracker | 1 / 1 |
| tpo-joining-followup-model.ts | ✓ tpoJoiningFollowupQuerySchema, ✓ projectTpoJoiningFollowups, ✓ TPO_JOINING_FOLLOWUP_CSV_LIMIT, ✓ tpoJoiningFollowupCsv | 4 / 4 |
| tpo-offer-lifecycle-model.ts | ✓ TPO_OFFER_ACTIONS, ✓ tpoOfferLifecycleInputSchema, ✓ canRecordTpoOfferAction | 3 / 3 |
| tpo-offer-lifecycle-service.ts | ○ recordTpoOfferLifecycle | 0 / 1 |
| college-retention-report-service.ts | ○ getCollegeApplicationRetentionReport | 0 / 1 |
| college-retention-report-policy.ts | ✓ COLLEGE_APPLICATION_RETENTION_DAYS, ✓ collegeApplicationRetentionCutoff | 2 / 2 |
| placement-offer-expiry-sweep-service.ts | ○ sweepExpiredPlacementOffers | 0 / 1 |
| offer-cascade-undo-service.ts | ○ undoPlacementOfferCascade | 0 / 1 |
| tpo-drive-deadline-model.ts | ○ tpoDriveDeadlineSchema, ○ evaluateTpoDriveDeadline | 0 / 2 |
| tpo-drive-deadline-service.ts | ○ getTpoDriveDeadlineState, ○ extendTpoDriveDeadline | 0 / 2 |

Sampled core inventory: **80 runtime exports**, **38 directly referenced names** and **42 with no direct name reference in eight sampled tests**. It is a prioritized gap map, not a certification or an exhaustive 967-file inventory. Unreferenced service exports must be assigned proper behavioural/DB tests, especially mutations and exports.

### New deep negative paths added after the inventory

- PLACEMENTS-DEADLINE-SM-01 — tests/unit/chat5-placements-deadline-and-cascade-breakit.test.ts exercises PUBLISHED/ACTIVE-only editing, invalid dates, same/past deadlines, forged request properties, optimistic update lock and the transactional audit preflight in extendTpoDriveDeadline. **No DB runtime execution**.
- PLACEMENTS-CASCADE-BREAK-01 — the same file tests accepted-history cascade token, joined outcome, changed sibling rejection and confirms owner college/membership row lock, exact status-history reconciliation and idempotent undo source paths in undoPlacementOfferCascade. **No DB runtime execution**.


## 18 October continued hardening — top-priority project/TPO boundaries and selection consistency

| Case | Behavioural or database test | Production guard / remaining gap |
|---|---|---|
| PROJ-BREAK-TPO-01..04 | `tests/unit/chat5-PROJ-BREAK-TPO-role-boundaries.test.ts` exercises actual `can()` / `requirePermission()` for TPO same college, cross college/organization, disabled user, suspended membership, Super Admin acting-college scope and TPO project-write denial | Project read may be college-scoped for TPO, but project manage/template assignment is denied. No full browser project-service IDOR run. |
| PROJ-BREAK-TPO-05/06 | Same test exercises `projectNoticeHref` for learner/mentor destinations, percent-encoded hostile IDs, and inspects active same-college recipient/role filters and dedupe in `project-notification-service.ts` | Source fix percent-encodes project IDs. Real notification transaction with revoked TPO and duplicate event requires PostgreSQL. |
| TPO-campaigns-public-25 | `tests/unit/chat5-delegated-policy-decisions.test.ts` updated to require actual `expectedLinkId` and reject stale/missing link version while permitting explicit disabled state | Fixed obsolete failing assertion, **not** a weakening of stale-link protection. |
| PLACEMENTS-SELECTION-ERROR-02..05 | `tests/unit/chat5-placement-selection-safe-results.test.ts` exercises SQL/auth/internal exception masking and stale-copy mapping; source verifies both partial-release catches | Fixed raw per-row `error.message` returned by `verifyAndReleaseTpoSelections`; selected rows and partial results remain preserved. Two-transaction release crash recovery remains open. |
| PLACEMENTS-SELECTION-IDEMP-01 | `tests/unit/chat5-selection-idempotent-record.test.ts` tests exact same selection replay, reordered rows, role/CTC/status mismatch, invalid payload and source ordering under locks | Fixed duplicate audit and `recordedAt` drift on same-payload retries in `recordTpoDriveSelections`. |
| PLACEMENTS-SELECTION-IDEMP-DB-01 | `tests/integration/placements-p8-offers.test.ts`: seed published job, final passed learner, record selection, retry exact request; assert same row, same recorded timestamp, exactly one selection audit; wrong-college TPO and learner attempts denied, no extra DB rows | **Added PostgreSQL test, execution pending cloud CI**. Cleanup removes `placement_drive_selections` before offers/applications. |

The central project ledger is managed by chat-14, so chat-5's narrowly scoped TPO/Projects crossover evidence is tracked **here**, avoiding conflicting writes. The project-notice helper now percent-encodes path identifiers without affecting normal UUID links. This does not assert a broad Projects coverage certification. The inherited Placements high-risk gaps — atomic waitlist+offer release, sweeper response competition, full 1,018 placement files, and TPO page deployed-device coverage — remain **open**.


### Further S1 waitlist release race hardening

- **PLACEMENTS-WAIT-IDEMP-01:** `decideWaitlistReleaseSettlement` is an explicit three-state pure policy: PENDING/no offer -> WRITE; RELEASED/same offer ID -> IDEMPOTENT; changed offer or state -> STALE. This prevents duplicate RELEASED reconciliation and a second audit when two TPO requests finish at nearly the same instant.
- Both reconciliation paths in `offerToNextWaitlisted` now lock the promotion row (`FOR UPDATE`) before deciding; a second waiter on an already released *same* canonical offer returns successfully without updating `releasedAt` or appending another audit.
- **Test:** `tests/unit/chat5-waitlist-settlement-race.test.ts` validates the state/action matrix and transaction source ordering. **Execution pending.**
- **Still S1 release blocked:** the reservation, canonical offer issuance and settlement are different database transactions. These changes do not make that workflow crash-atomic or guarantee offer capacity under every mixed issuer. PostgreSQL chaos/retry tests and an outbox/transaction redesign may still be necessary.


## Further TPO second-third workflow coverage (model behaviour)

`tests/unit/chat5-tpo-second-third-remaining-workflows.test.ts` adds executable model assertions, complementing existing source audits:

| Cases | Concrete boundary | Covered states / preserved UX |
|---|---|---|
| PLACEMENTS-CLOSE-SM-02/03 | `evaluateTpoDriveClosure`, `tpoDriveCloseSchema`; `/tpo/placements/jobs/[jobId]/close-preview` | PUBLISHED+ACTIVE only, unreleased selections block closure, stale counts and invalid dates reject; blocked copy identifies selections/offers rather than hiding the action. |
| PLACEMENTS-LETTERS-01 / TPO-2ND-PAGE-letters-02 | `projectOfferLetterEvidence`; letters page | Evidence is persisted offer status/date only, never invented letter-issued or acknowledged state; TPO, permission and college checks; explicit no-storage message and empty table. |
| PLACEMENTS-SHARE-PREVIEW-01/02 | `projectRecruiterVisibleShortlist`, `tpoShareableShortlistQuerySchema`, `tpoShareableShortlistCsv` | Three approved identity fields only, formula-neutralized CSV, explicit 500-row cap, malformed/oversized query denied. |
| TPO-2ND-PAGE-share-preview-03 | Shortlist share-preview page | Role and scoped service, read-only warning, separate independently paginated actual company shares, empty state and no claimed delivery. |
| PLACEMENTS-SHORTLIST-01 | `projectTpoShortlist`, `tpoShortlistQuerySchema`, `tpoShortlistCsv` | Empty names/roll/time stay unknown; invalid page rejected; dates drawn only from persisted decision. |
| PLACEMENTS-SHARE-PAGE-01/02 | `recoverCompanyShareLinkPage`, `clampCompanyShareLinksPage`, `companySharePreviewSearchState`, `prependCompanyShareLink` | Independent link history pagination, invalid query recovery, cap 25, deduplicated newly issued share. |

**Remaining:** routes' live 401/403/404/error and mobile browser states, correlated POST route actual origin checks, and PostgreSQL shared-link history/read isolation must run before closing this TPO page group.

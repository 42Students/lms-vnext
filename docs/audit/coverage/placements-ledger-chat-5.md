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


### Previously unreferenced placement model coverage: adversarial CSV/identity

- **TPO-AUDIT-CSV-01:** `tpoAuditCsv` now neutralizes spreadsheet formulas after leading whitespace, not just in the first character. `tests/unit/chat5-placements-weak-audit-export-and-bulk-ids.test.ts` covers leading spaces/tab/quote, escaped multiline and output delimiters.
- **TPO-STUDENTS-BULK-AMBIG-01:** `matchTpoStudentRolls` was a last-wins map, potentially selecting the **wrong membership** for a duplicated or case-folded roll or registration ID. It now treats shared identifiers as unresolved rather than picking any learner; the same test covers cross-field duplicate, repeated same membership, dedupe and normal case-insensitive matches.
- The same test covers `roundApplyPreviewCsv`, `roundApplyReportCsv`, `tpoRoundFailureCsv` and its query schema, `tpoIndiaCalendarDay` at 18:30 UTC IST midnight, and `tpoStudentClipboardCell`/`tpoStudentClipboardTsv`.
- **State:** unit tests authored, not executed. The TPO student bulk UI should present ambiguous rolls as unresolved so staff can correct identifiers; no automatic learner assignment is permitted. Live user journey and all 100 other previously-unreferenced placement source paths remain part of the backlog.


### PLACEMENTS-CLOSE-ENDED-01 — cross-service lifecycle reconciliation

A published drive could be closed by the `evaluateTpoDriveLifecycle` policy after its placement season ended, but both the canonical `closePlacementJob` path and the more carefully versioned `closeTpoDriveWithPreview` path refused it because they required `ACTIVE` season status. That prevented late closeout, application withdrawal settlement, recruiter notices and final audit for a real-ended season. The canonical close service no longer blocks on season ACTIVE; the preview model and preview read permit `PUBLISHED` with a **registered** CLOSED season while still requiring zero issued offers, zero unreleased selections, exact persisted impact counts, expectedUpdatedAt CAS, audited transaction and all withdrawal/applicant effects. Missing season still fails closed. The page now describes this accurately without claiming seasons must be ACTIVE.

`tests/unit/chat5-tpo-second-third-remaining-workflows.test.ts` checks the actual close-policy states and the source-level two-service contract and blocked copy. The full PostgreSQL ended-season fixture and race tests are **not executed**. A separate canonical `closePlacementJob` race/cancel regression is still required.

### PLACEMENTS-EXPIRY-RACE-04 — locked-wall-clock offer transitions

`actOnPlacementOffer` previously checked expiry against the same function-entry `now` both before and after waiting for the offer row lock. A learner response beginning immediately before deadline could be serialized behind another transaction, acquire the row after the deadline, and still be accepted. This would violate inclusive expiry and misstate the effective acceptance timestamp. The write path now calculates `lockedNow=placementOfferLockedDecisionTime(now,new Date())` **after** acquiring the offer row lock, uses this later instant for expiry and persisted response/cascade/withdrawal timestamps; invalid injected clocks fail closed. The shared `isPlacementOfferResponseExpired` also rejects malformed `now` instead of treating it as prior to expiry.

- `tests/unit/chat5-placements-core-state-machines.test.ts` includes `PLACEMENTS-EXPIRY-RACE-04`: before/after lock boundary, explicitly bad clocks and null-expiry handling.
- `tests/integration/placements-p8-offers.test.ts` includes `PLACEMENTS-EXPIRY-RACE-DB-04`: seeded completed round/issued offer, DB FOR UPDATE hold, an explicitly pre-expiry submitted action, release after deadline, assert rejection and **zero ACCEPTED history**. **Cloud PostgreSQL run pending**.
- Distinct risk: expiry sweep worker can still contend with the learner decision at the exact instant and needs separate two-worker/outbox notification tests. No exactly-once certification.

### PLACEMENTS-OFFER-RETRY-05 — durable response retries after expiry

An ACCEPT/DECLINE operation previously checked the deadline before reading its row lock, so a lost HTTP response retried after expiry failed even though the original decision had been committed. This contradicted the existing accepted/declined idempotent response branch and could mislead a learner into thinking the original decision was never saved.

`canReplayFinalOfferResponseAfterExpiry` requires **matching action, matching final status and the same persisted responding user**. `actOnPlacementOffer` still authenticates and checks the actual live learner membership and user under locks, validates expectedStatus, and rejects every *new* or changed response after expiry using the post-lock clock. Only the original immutable result may be replayed. Test matrix: `tests/unit/chat5-placements-core-state-machines.test.ts` (PLACEMENTS-OFFER-RETRY-05); actual PostgreSQL status-history invariants in `tests/integration/placements-p8-offers.test.ts` (PLACEMENTS-OFFER-RETRY-DB-05). CI execution pending.

**Latest listed unit failure:** `chat5-delegated-policy-decisions.test.ts` / `TPO-campaigns-public-25` was already repaired by a5379fd (11:53 UTC) to carry mandatory `expectedLinkId`, preserve stale-CAS negative cases and retain revocation. The rolling failures file retains the older `CI ff6819dd` title; the updated test, model and revoke service are consistent on current main. Do not weaken the expected-link rule to satisfy an older CI snapshot.

### PLACEMENTS-OFFERS-IDOR-07 — foreign academic cohort leakage

`enrichTpoOfferFacts` scopes the learner membership to college A, but it had selected `cohorts.name` directly from an active enrollment even if that enrollment pointed at a program/department belonging to college B. Invalid FK-consistent data could therefore leak a foreign cohort label in the TPO offer grid/export. The query now projects `batch` using `CASE WHEN departments.id IS NOT NULL THEN cohorts.name ELSE NULL END`, where the department JOIN explicitly requires the authenticated college. It continues to show batch/branch for a valid same-college enrollment.

PostgreSQL negative/positive test `tests/integration/chat5-tpo-offer-academic-tenant-isolation.test.ts` inserts a disposable same-college membership with a foreign enrollment, asserts **batch/branch NULL and no foreign name**, then switches to a legitimate local program/cohort and asserts those values remain visible. It cleans every fixture in reverse FK order. Cloud execution pending; all other academic report models still need separate cross-tenant checks.

### PLACEMENTS-CLOSE-PENDING-06 — direct close cannot strand selections

The canonical `closePlacementJob` write path still supported auto-withdrawal of outstanding offers, but unlike the explicit TPO close-preview path, it did **not** check for `SELECTED` or `VERIFIED` company selections. A direct-close request could switch the job to CLOSED with an unreleased selection still pending and no clear reconciliation path. The direct close transaction now checks those persisted statuses after acquiring the job UPDATE row lock and rolls back with `PLACEMENT_JOB_NOT_CLOSABLE` if any are present. Existing issued-offer withdrawal behavior is preserved for drives with no pending selections.

PostgreSQL `PLACEMENTS-CLOSE-PENDING-DB-06` in `tests/integration/placements-p8-offers.test.ts` records a ready selection, attempts direct close, asserts rejection, persisted PUBLISHED job, still-SELECTED row and no close audit. This is the required failure-atomicity guard; cloud CI execution pending. Cross-service close-vs-selection concurrency and cancellation state deserve additional load validation.

### PLACEMENTS-CAPACITY-01/02 — canonical offer ceiling and waitlist reconciliation

Code review identified a high-impact capacity race: `issuePlacementOffer` checked applicant readiness and held-offer policy but did **not** enforce `placementJobs.openings`. The issuer took `FOR SHARE` on its job, so two different applicants could issue the final seat at the same time. A pending waitlist reservation could also be bypassed by ordinary issuance, while the waitlist preview counted LOIs as occupied official seats.

The canonical issuer now locks the job row `FOR UPDATE` before all candidate and offer writes, counts active official **OFFER** rows plus `PENDING` waitlist reservations belonging to **other** applications, and rejects if they exhaust `openings`. The currently promoted applicant's own pending reservation is excluded to prevent double-counting. `LOI` does not consume an official OFFER seat; duplicate same-offer retry remains before the new capacity check. `getTpoWaitlistPreview` and the locked reservation path use official OFFER seat counts while still treating any active LOI/offer as an existing candidate commitment. Source of truth is `hasAvailablePlacementOfferSeat` in `src/modules/placements/offer-seat-capacity-policy.ts`.

`tests/unit/chat5-placement-offer-capacity.test.ts` exercises no opening, exhausted last seat, other reserved seats, own pending reservation, unlimited openings, invalid counts, authoritative job-lock/issuer transaction ordering and LOI vs OFFER preview behavior. **Cloud CI/PostgreSQL concurrency verification remains pending**; in particular serialization conflicts must be surfaced as safe conflicts, and multi-role/per-role capacity must be reviewed before release.

### PLACEMENTS-CAPACITY-03 / PLACEMENTS-CAPACITY-PG-01 — serialization feedback and durable seat accounting

With the job lock changed to `FOR UPDATE`, a losing PostgreSQL contender may receive SQLSTATE `40001` (serialization failure) or `40P01` (deadlock). `isPlacementIssuanceConcurrencyError` now recognizes both SQLSTATEs, including wrapped driver causes, and maps them at the issuance transaction boundary to the actionable, safe `PLACEMENT_JOB_PREVIEW_STALE` conflict. It intentionally does **not** translate unrelated constraint and database failures. `tests/unit/chat5-placement-offer-capacity.test.ts` covers safe mapping and wrapped/cyclic error shapes.

A new isolated seeded PostgreSQL scenario in `tests/integration/placements-p8-offers.test.ts` (**PLACEMENTS-CAPACITY-PG-01**) verifies that a pending reservation on *another application* blocks the only official opening without persisting an offer; replacing it with the same applicant's own reservation permits exactly one official offer, and retry returns that exact durable offer. The test also extends teardown order to delete waitlist reservations before their foreign-key parents. **Authored, not executed**. A simultaneous two-session issuer race and cross-role capacity behavior remain mandatory release checks.

### PLACEMENTS-ISSUE-ACTOR-02 — suspended candidate versus stale shortlisting

A college's TPO can keep seeing a formerly shortlisted application after a learner membership is suspended or a user is disabled. `issuePlacementOffer` previously locked and checked only the candidate membership's **college**, leaving both account states unchecked; no fresh official offer should be issued to a deactivated learner. It now locks and checks the candidate membership `ACTIVE` and the linked user platform `ACTIVE` inside the canonical issuance transaction, before writing offer/history/notifications. It still rejects foreign-college membership as not found.

`PLACEMENTS-ISSUE-ACTOR-DB-02` in `tests/integration/placements-p8-offers.test.ts` suspends the seeded learner membership, then disables the user's platform account, asserting each issuance fails without a new offer. Both fixture states are restored in `finally`, and the same valid eligible candidate can then receive a normal offer. This PostgreSQL regression is **unexecuted** pending cloud CI.

### PLACEMENTS-OFFERS-IDOR-08 — enrollment relationship and period integrity

The earlier offer-enrichment guard still allowed incorrect academic associations: an ACTIVE enrollment could cite a program from the requested college while its cohort belonged to a different program, or a same-program cohort could use a start period in a foreign college. Valid foreign-key values alone do not prove tenant correctness. The read joins now require the cohort's `programId` to equal the enrollment's `programId`, that program's department to belong to the request college, and the cohort's start academic period to belong to that same college. Both cohort and branch labels are withheld for inconsistent relationships. Existing correctly scoped roster data remains visible.

`tests/integration/chat5-tpo-offer-academic-tenant-isolation.test.ts` covers (1) entirely foreign program/cohort, (2) local program with mismatched foreign cohort, (3) local program/cohort with foreign academic start period, and (4) legitimate local program/cohort/period as a positive control. The test is authored, not run; release gating remains contingent on cloud PostgreSQL execution.

### PLACEMENTS-TPO-ROLE-FIXTURE-01 / REVOKE-RACE-02 — real TPO authorization

The deterministic seed has a FACULTY and MENTOR role for the seeded faculty member, but **no persisted TPO role**. Existing P8 tests constructed a `RequestContext` with `TPO` in memory; every mutation backed by `requireTpoJobActor` would otherwise correctly reject that forged claim. P8 integration setup now provisions one identifiable TPO role for its own suite, deletes that fixture at teardown, and the explicit role-revocation test restores the same identifier after its negative assertion. This allows the tests to prove the live role-check behaviour rather than assuming client claims.

`requireTpoJobActor` also now holds `FOR SHARE` on its persisted membership/role/user authorization join inside destructive TPO transactions, serializing a role suspension/removal against an already-authorized write. `recordTpoOfferLifecycle` invokes this guard before any selected offer read or mutation. The source ordering is asserted in `chat5-tpo-account-breakit.test.ts` and a revoked-role PostgreSQL case is in `placements-p8-offers.test.ts`. They are not marked passed until cloud CI reports outcomes.

### PLACEMENTS-TPO-DUAL-ACCEPT-01 — bulk acceptance consistency

Administrative `RECORD_ACCEPTED` previously bypassed the canonical learner acceptance rule that forbids two simultaneous accepted offers for the same college learner. The batch service now serializes affected learner membership locks in UUID order **before** locking offer rows, consistent with the canonical learner accept lock order, and refuses an acceptance if a second college-scoped `ACCEPTED` offer already exists. If two offers for the same learner are accepted in one batch, the transaction rolls the whole batch back, including history and audit. The PostgreSQL adversarial fixture `PLACEMENTS-TPO-DUAL-ACCEPT-DB-01` checks both ISSUED offers remain unchanged and no ACCEPTED history exists; execution is pending.

**Separate open integrity concern:** TPO-recorded acceptance has not been proven to apply the complete canonical sibling-withdrawal/dream-uplift cascade. It must not receive launch sign-off merely because the dual-accepted guard passes.

### PLACEMENTS-SELECTION-RECONCILE-02/03 — safe release of verified company selections

The verified-selection recovery path formerly read an offer and recorded-at timestamp outside the transaction, then changed the selection to RELEASED using only its status and job ID. Another reviewer could change the selection's terms/version between those steps, and a **letter of intent** with matching terms could be mistaken for the official OFFER. Both the lost-response recovery and post-issuance settlement now lock the persisted selection, enforce exact recorded-at version, candidate application, role and annual CTC, and no-op on a previously released **same** offer without duplicate audit. Reconciliation additionally requires a persisted matching canonical `OFFER` (not LOI) in ISSUED/ACCEPTED status before writing RELEASED. Failure remains a safe stale-preview conflict.

`tests/unit/chat5-placement-selection-safe-results.test.ts` protects these pre-write and post-write invariants and the immutable replay branch. A real two-TPO stale-selection/issue/release/expire race and exactly-once notification integration remain unexecuted and open.

**PLACEMENTS-SELECTION-RECONCILE-DB-03** adds a PostgreSQL fixture for the previously unproven LOI distinction: a properly VERIFIED selection and active, exactly matching `kind='LOI'` must yield `released=0`, `skipped=1`, remain VERIFIED with `released_offer_id IS NULL`, and create **zero** RELEASED activity events. This protects official offer evidence from LOI confusion; test execution and real concurrent reviewer/version races remain pending.

### PLACEMENTS-SELECTION-CAS-04 — runtime behavioural revision matrix

To move beyond source-string-only checks, `matchesTpoSelectionReleaseRevision` now provides one deterministic pure policy used by both lost-response reconciliation and post-issuance settlement. It requires a valid persisted `recordedAt` instant and exact optimistic timestamp, candidate application, role title and annual CTC. Neither invalid dates nor null-versus-number salary drift are tolerated. `tests/unit/chat5-placement-selection-safe-results.test.ts` exercises matching and changed timestamp/application/role/CTC/invalid-clock cases. The service still separately checks row state and canonical `kind='OFFER'` evidence under the lock. Execution pending cloud CI.

### PLACEMENTS-OFFER-SEASON-05 / PLACEMENTS-SELECTION-SEASON-06

An inconsistent PUBLISHED job can outlive its parent season. Closing it for reconciliation remains allowed, but fresh official offers and recorded or verified company selections now require the same-college season to be ACTIVE. `issuePlacementOffer` checks the season under a transaction read lock; the TPO selection service uses one active-season guard inside each of its four write branches. The existing closed-season PostgreSQL fixture now checks no offer and no selection are created before the administrator closes the drive. Pure/source guard tests cover the early failure. CI/PostgreSQL execution is still pending.

**PLACEMENTS-SELECTION-SEASON-07 exception:** Only three branches that could create a new selection/verification or issue and settle a *new* offer require ACTIVE season. The separate lost-response reconciliation branch has no new issuer call: it may finalize an already-issued, matching official OFFER under an ended season, provided the row lock, exact revision, persisted canonical offer kind/status and college scope all match. Preventing this recovery would strand verified historical results. Source+unit regression `chat5-placement-selection-safe-results.test.ts` checks the distinction; cloud execution pending.

## CI ff6819dd follow-up — chat-5 source corrections (2026-10-18)

| Case | Source and test | Review / verification limit |
|---|---|---|
| UX-placements-scroll-motion-06 | `tests/unit/chat5-placements-scroll-motion-surfaces.test.ts` checks `TpoRoundDriveDayReadOnly` uses the shared `DataTable`, semantic column headers, roster caption, and its `ScrollCue` keyboard focus and overflow cues | The old source-only assertions were stale: the manually rendered table was replaced with `DataTable`; preserve behavior through shared component assertions. Browser scroll and keyboard handling await CI/browser validation. |
| UX-placements-scroll-motion-11 | Same test checks `PlacementDriveDayOverview` uses candidate as the first, phone-primary column and the shared sticky first column | The previous hard-coded `min-w-[42rem]` and inline `<td>` checks were stale after migration to responsive `DataTable`. Real 320/360px device testing remains open. |
| PLACEMENTS-SELECTION-CAS-04/05 | `src/modules/placements/tpo-drive-selection-model.ts` and `tpo-drive-selection-service.ts`; `tests/unit/chat5-placement-selection-safe-results.test.ts` | Corrected false stale-review outcomes for equivalent ISO timestamps with different UTC offsets, while still requiring the same persisted millisecond instant, application, role and CTC. Revision tests were written, not executed. |
| PLACEMENTS-SEL-SM-03 | `src/modules/placements/tpo-drive-selection-model.ts`; `tests/unit/chat5-placements-core-extended-state-machines.test.ts` | Exact replay requires distinct applicant IDs on both sides in addition to matching persisted terms; no duplicate replay may suppress recording. Database idempotency and audit paths await PostgreSQL testing. |
| PLACEMENTS-WAIT-SM-03 | `src/modules/placements/tpo-waitlist-promotion-model.ts`; `tests/unit/chat5-placements-core-extended-state-machines.test.ts` | Enumerates PENDING→RELEASED, idempotent identical offer and forbidden conflicting/cancelled settlements; physical seat, notification and two-transaction crash recovery remain open. |

Latest test-failure file: `docs/orchestrator/unit-failures-latest.md` (chat-5 had four UX assertions in one test file). The four obsolete source-shape assertions were replaced by shared-component behavior contracts; **no test suite or TypeScript compiler was run in this lane**, so CI outcome is still pending. Production typecheck and lint were reported as PASS in `docs/orchestrator/typecheck-errors-latest.md`; no chat-5 test-file type errors were listed. This is still a partial ledger, not exhaustive certification.


## Additional state-machine and TPO page safeguards (current branch; CI pending)

| Case | Source fix | Direct tests | Still missing |
|---|---|---|---|
| PLACEMENTS-EXPIRY-SM-04 | `placement-offer-expiry-sweep-service.ts` now rejects nonfinite scheduler time before SQL; `placement-offer-sweep-policy.ts` fails closed for invalid clocks | `chat5-placements-core-state-machines.test.ts` checks exact boundary, malformed expiry, invalid clock and terminal status | Actual concurrent sweep-versus-learner-response PostgreSQL test, scheduler invocation |
| PLACEMENTS-JOIN-SM-04 | `tpo-offer-lifecycle-model.ts` requires actual joining date on or before current IST day; `tpo-offer-lifecycle-service.ts` enforces it inside the mutation transaction | `chat5-placements-core-extended-state-machines.test.ts` tests 23:59→00:00 IST, malformed calendar dates and future records | Actual TPO transaction and joining-history assertions |
| PLACEMENTS-OFFERS-EXPIRY-04 | `tpo-drive-offer-register-model.ts` now represents invalid persisted expiry/reference timestamps as UNKNOWN rather than OPEN | `chat5-tpo-second-third-behavior.test.ts` checks exact expiry, seven-day boundary, terminal states and invalid dates | Browser rendering and on-screen/export snapshot consistency |
| PLACEMENTS-SELECTION-CAS-06 | `tpo-drive-selection-service.ts` now calls `matchesTpoSelectionReleaseRevision` on the **verification row lock**, comparing application, role, CTC and normalized time rather than only ISO text; earlier preflight and settlement already use the same helper | `chat5-placement-selection-safe-results.test.ts` checks authorization/lock, exact revision guard, stale-date rejection | Two-reviewer race / mid-flight change in PostgreSQL |

No TypeScript, Vitest or PostgreSQL execution was performed in this lane. The coordinator's `typecheck-errors-latest.md` lists no chat-5 compilation error. The earlier four chat-5 source-shape unit failures were addressed on the branch and require CI confirmation. This ledger remains **incomplete** by the master queue's exhaustive coverage criteria.


## Waitlist fairness and TPO offers visibility, additional branch evidence

| Case | Source | Tests written (not executed) | Operational implication |
|---|---|---|---|
| PLACEMENTS-WAIT-TOKEN-04 | `tpo-waitlist-promotion-model.ts` canonicalizes promotion and active-offer arrays; `tpo-waitlist-promotion-service.ts` uses sorted arrays in token | `chat5-placements-core-extended-state-machines.test.ts` checks permutation invariant and token changes on true state changes | Unordered PostgreSQL `SELECT` returns no longer yield false stale previews |
| PLACEMENTS-WAIT-SEASON-05 | `getTpoWaitlistPreview` joins college-scoped season and blocks candidate promotion when not ACTIVE; `offerToNextWaitlisted` verifies ACTIVE season under shared lock, after job update lock and before reservation | `chat5-placements-core-extended-state-machines.test.ts` source guard + `placements-p8-offers.test.ts` PostgreSQL inactive-season/no-reservation case | Closing a season between preview and reservation may no longer strand a pending seat; cross-transaction offer/settlement crash risk remains |
| PLACEMENTS-OFFERS-EXPIRED-05 | Offer register status filter, counts, on-page tabs, and CSV accept actual persisted EXPIRED status | `chat5-tpo-second-third-behavior.test.ts` checks issued-vs-expired distinction, persisted total, and matching CSV | TPO can filter truly expired offers without interpreting merely overdue ISSUED as persisted EXPIRED |
| PLACEMENTS-P8-DATE-01 | Test fixture only | `placements-p8-offers.test.ts` near-term test schedule/expiry instants updated to 2099, including injected expiry comparison clock | Prevents calendar passage from breaking integration tests during later CI runs |
| PLACEMENTS-SELECTION-CAS-06 | Selection verification row lock compares normalized instant **and** application, role, CTC | `placements-p8-offers.test.ts`: PostgreSQL IST-offset release then retry with one verification/release event each | Regression for client-offset timestamp form on real DB; not executed locally |
| PLACEMENTS-JOIN-SM-04 | TPO actual joining date must not be a future IST day | `placements-p8-offers.test.ts`: rejected future joined record leaves persisted PENDING and no history, positive actual joining creates one history event | Requires cloud DB and membership-role fixture to confirm |

The branch was reconciled with the then-current `origin/main` using a two-parent merge commit without overwriting newer unrelated lane files. **CI is still needed** to establish executable coverage and to verify new PostgreSQL integration tests. Hundreds of other placement exports and routes remain outside the ledger; the core module is **not** exhaustively certified or releasable from these source checks alone.


## TPO offer filter contract, source-only correction

- **PLACEMENTS-OFFERS-FILTER-06** — `src/modules/placements/tpo-drive-offer-register-model.ts` distinguishes a submitted blank numeric filter (unbounded) from explicitly entered 0 LPA; CSV and page use the same `offerRegisterQuery` parser. `tests/unit/chat5-tpo-second-third-behavior.test.ts` covers blanks, zero, malformed numbers and retained ISSUED search matches. Cloud Vitest was not run.


### Current follow-up: API edge cases and sweep input integrity

- `PLACEMENTS-OFFERS-FILTER-06`: blank, whitespace-only, `null` and `undefined` package bounds now mean unbounded; explicit zero remains a valid bound; malformed/out-of-range values reject. Tested in `tests/unit/chat5-tpo-second-third-behavior.test.ts` against parsed filters and projected offer lists.
- `PLACEMENTS-EXPIRY-SM-04`: `tests/integration/placements-p8-offers.test.ts` now verifies invalid reference clocks and unsafe batch limits reject before any expiration history can be written. The actual concurrent worker-vs-learner response race still requires dedicated DB tests.
- No local tests, TypeScript compiler, PostgreSQL or browser were executed. Newly written integration assertions are pending the next cloud CI run.


### PostgreSQL race coverage authored in this branch

- `PLACEMENTS-EXPIRY-RACE-05`: `tests/integration/placements-p8-offers.test.ts` races the expiry sweep with a learner ACCEPT submitted immediately before the same deadline. It checks one persisted terminal outcome (ACCEPTED or EXPIRED), exactly one corresponding status-history transition, and the sweep's row-lock/skip-locked result. **Cloud execution pending**.
- `PLACEMENTS-WAIT-RACE-06`: the same integration suite concurrently submits the identical rank-1 HOLD promotion. It checks a single reservation, a single active official offer, matching offer linkage, and one audit event per distinct reservation/reconciliation category. A stale-preview rejection by one racing call is permitted; two offers are not. **Cloud execution pending**.
- These tests strengthen the previous source-only release evidence but do **not** close the crash-atomicity gap between reservation, issuance, and settlement, or the full role/tenant matrix across all Placements services.


## Additional live-data error handling (CI pending)
- **PLACEMENTS-SEL-SM-07:** strict selection release payload requires a bijection between chosen `selectionIds` and `expectedRecordedAt` entries. No unsolicited, omitted or duplicated revision keys can pass review. Model: `tpo-drive-selection-model.ts`; test: `chat5-placements-core-extended-state-machines.test.ts`.
- **PLACEMENTS-OFFERS-EXPIRY-07:** unknown/invalid optional offer timestamps no longer throw in TPO offer register projection or CSV. The same pure helper yields null response-hours instead of NaN. Model `tpo-drive-offer-register-model.ts`; test: `chat5-tpo-second-third-behavior.test.ts`.
- **PLACEMENTS-OFFER-SM-08:** an ISSUED offer with any already persisted joining state is internally contradictory and is rejected by all TPO administrative status actions. Acceptance and offer extension require no joining record. Model: `tpo-offer-lifecycle-model.ts`; test: `chat5-placements-core-extended-state-machines.test.ts` (entire matrix plus contradictory-state cases).

These are source-level changes with new Vitest assertions, not evidence of a successful CI or PostgreSQL run. The canonical acceptance-cascade parity between learner and TPO-recorded decisions remains a separate high-risk integration task.


## Additional TPO UI state-machine boundaries (branch, cloud checks pending)

| Case | Scope | Evidence | Still outstanding |
|---|---|---|---|
| PLACEMENTS-OFFER-IST-09 | `tpo-offer-lifecycle-model.ts`, `tpo-offer-lifecycle-panel.tsx` | `chat5-placements-core-extended-state-machines.test.ts` verifies browser-independent IST parsing of `datetime-local` including year rollover, calendar-invalid input rejection, and TPO form preflight | Browser timezone simulation, authoritative server clock expiry competition |
| PLACEMENTS-WAIT-UI-10 | `tpo-waitlist-promotion-control.tsx` | `chat5-tpo-second-third-behavior.test.ts` checks synchronous `useRef` double-submit exclusion, bounded `apiFetch` timeout, safe HTML/non-JSON errors and positive integer seat evidence | Rapid double click browser test, lost HTTP reply recovery against PostgreSQL |

These fixes do not weaken existing confirmations, selection limits or legacy copy. The final-sprint Faculty Courses source changes `FAC-courses-07` (soft GET navigation) and `FAC-courses-02` (safe bundled fallback; authored photo storage blocked) are tracked in `docs/audit/acceptance/faculty-courses-verification.md`. Tests/typecheck were **not run** by chat-5.


### CI triage: derived TPO preparation + bounded joining export
- **TPO-PREP-TSC-01** — `src/modules/placements/tpo-prep-readiness-derived-service.ts` now consistently aliases the Drizzle `cohorts` table as `cohortTable`, avoiding the reported CI shadowing/type ambiguity; existing college, active membership and enrollment joins are preserved. `tests/unit/chat5-placements-retention-and-joining-followups.test.ts` checks the table reference, role gates and every requested scoped cohort pair. This is a source-level fix; cloud typecheck still pending.
- **PLACEMENTS-JOINING-TRUNC-11** — joining-followup CSV detects upstream source truncation (first 500 accepted offers) separately from its own 200-row export cap, adds a `SOURCE_TRUNCATED` disclosure and never represents sample counts as full-season totals. `tests/unit/chat5-placements-retention-and-joining-followups.test.ts` verifies both bounded and unbounded cases; `tpo/reports/joining-followups` already warns when source counts are partial.


### Drive closure reservation guard — PLACEMENTS-CLOSE-WAIT-12

`tpo-drive-close-preview-service.ts` now counts `PENDING` `placement_waitlist_promotions` under the owning drive, and refuses close both on initial preview and inside the job-row locked mutation transaction. This prevents a drive closing in the two-transaction window after waitlist seat reservation and before offer issuance. `tpo/placements/jobs/[jobId]/close-preview/page.tsx` explicitly says the reserved waitlist offer is pending, rather than mislabelling it a selected company candidate. Tests: `tests/unit/chat5-tpo-second-third-remaining-workflows.test.ts` and `tests/integration/placements-p8-offers.test.ts` (named `PLACEMENTS-CLOSE-WAIT-12`). Cloud test / PostgreSQL CI remains pending.


### TPO mutation request-size boundaries (body parsing before Zod)

Four scoped TPO endpoints now call the existing streaming `readTpoBulkRequestBody` helper **after same-origin validation, before JSON parsing**, and map its `400/413/415` transport failures to bounded safe HTTP responses. They are `/api/placements/tpo/jobs/[jobId]/selections` (**PLACEMENTS-SELECTION-BODY-13**), `/waitlist-promote` (**PLACEMENTS-WAIT-BODY-14**), `/api/placements/jobs/[jobId]/offers/lifecycle` (**PLACEMENTS-OFFER-BODY-15**), and `/close-preview` (**PLACEMENTS-CLOSE-BODY-16**). This caps actual body chunks at 64KiB even when Content-Length is absent. Existing strict Zod input validation and actor transaction guards remain unchanged. `tests/unit/chat5-tpo-second-third-behavior.test.ts` includes named route source checks and bounded-reader tests. Neither tests nor compiler were run locally.


### PLACEMENTS-TPO-CASCADE-17 — canonical sibling effects for administrative acceptance

TPO-recorded `RECORD_ACCEPTED` now invokes `cascadeTpoRecordedAcceptance` inside the same offer transaction with the active learner membership mutex, college scope, role/employment-type internship exemptions, dream and salary uplift rules. Ineligible sibling offers are declined with correlated status history and submitted sibling applications are withdrawn with correlated application history. All history and audit metadata identify the **TPO actor**, not a synthetic learner response; the employer evidence reason remains in the activity event while the canonical accepted history carries `cascade:<uuid>` for undo correspondence. Source `src/modules/placements/tpo-offer-acceptance-cascade.ts`, integration `tpo-offer-lifecycle-service.ts`. Named tests: `tests/unit/chat5-placements-core-extended-state-machines.test.ts` and `tests/integration/placements-p8-offers.test.ts` (real job plus same-learner second submitted application, correlated withdrawal and audit). **Cloud PostgreSQL execution is pending**. Concurrent TPO batches, undo CAS and notification exact-once still need live acceptance.


### New owner-priority core hardening (2026-10-18, CI intentionally deferred)

| Case | Source-level behavior | Test evidence | Pending |
|---|---|---|---|
| PLACEMENTS-TPO-NOTICE-18 | `recordTpoOfferLifecycle` delivers to the active college-scoped learner in the same transaction as the persisted activity event; one event is the dedupe anchor, so neither GET nor a retry creates another notification | `tests/integration/placements-p8-offers.test.ts` — accepted evidence, one scoped recipient, rejection of repeated mutation | PostgreSQL execution |
| PLACEMENTS-TPO-NOTICE-19 | The delivery helper honors `notifyApplicationUpdates=false` for TPO-recorded decline without dropping audit/history | `tests/integration/placements-p8-offers.test.ts` — opt-out test with preference restoration and no notification | PostgreSQL execution |
| PLACEMENTS-TPO-ESCALATE-20 | `tpoWithdrawalEscalationWindow` rejects invalid date and derives an exact UTC 24-hour window; escalation errors returned to callers use fixed safe text, never SQLSTATE/provider exception messages | `tests/unit/chat5-tpo-withdrawal-escalation-edge.test.ts` — pure date behavior and scoped input/lock/dedupe contract | Cloud behavioral execution |
| PLACEMENTS-TPO-ESCALATE-21 | Withdrawal decision reminder stays PENDING, not auto-approved, and creates at most one durable deduped TPO event and notice for a next-round window | `tests/integration/placements-p8-offers.test.ts` — seeded request with a near round, role-scoped notification, repeat call, persisted state | PostgreSQL execution |

No CI/tests/TypeScript commands were run under the owner's new no-CI-until-final-pass directive. The core placements module remains partially audited, not exhaustive and not release certified.


### Owner no-CI sprint: additional behavioural hardening

| Case | Source | Behavioral coverage added | Certification status |
|---|---|---|---|
| PLACEMENTS-TPO-ESCALATE-26 | `tpo-withdrawal-escalation-service.ts` rejects a scheduler time whose 24h endpoint overflows JavaScript Date, filters inactive colleges, returns bounded friendly errors | `tests/unit/chat5-tpo-withdrawal-escalation-edge.test.ts` checks 24h IST crossing, overflow, active-college/role scope and dedupe | Source-only, CI deferred |
| PLACEMENTS-DRIVE-STOP-SM-24 | `tpo-drive-cancel-model.ts`, `tpo-drive-cancel-service.ts` keep already accepted offers, revoke outstanding issued offers, reject stale state | `tests/unit/chat5-tpo-closure-ux-boundary.test.ts` runs the decision matrix and source transaction guards | Source-only, CI deferred |
| PLACEMENTS-DRIVE-CLOSE-SM-25 | `tpo-drive-close-preview-model.ts` supports close after season end, blocks pending selected or waitlist seats | Same new test runs allowed/blocked state and revision cases | Source-only, CI deferred |
| UX-PLACEMENTS-CLOSE-22 | `tpo-drive-close-preview-form.tsx` uses safe `apiFetch`, a synchronous `useGuardedAction` lock, 35s timeout, preserved confirmation reason, safe conflict/retry message | `tests/unit/chat5-tpo-closure-ux-boundary.test.ts` checks guard, fields, confirmation and bounded fetch | Browser journey still required |
| UX-PLACEMENTS-JOINING-23 | `tpo-joining-update-form.tsx` guards duplicate PUT, uses bounded `apiFetch`, keeps date/correction reason on rejection, requires dialog for actual/corrected outcome | Same unit-contract suite | Browser journey still required |
| UX-PLACEMENTS-REPORT-SCROLL-27 | `report-interactive-table.tsx` column and filter sheets expose named keyboard scroll regions, hidden-bar edge cues and safe-area-aware closures | `tests/unit/chat5-placements-ux-workflows.test.ts`, `docs/audit/ux/scroll-motion-placements.md` | Mobile device acceptance pending |
| PLACEMENTS-RETENTION-ACTIVE-28 | `getCollegeApplicationRetentionReport` excludes any old withdrawn or rejected application still carrying `ISSUED` or `ACCEPTED` official offer; tenant joins and date cutoff remain | `tests/unit/chat5-placements-retention-and-joining-followups.test.ts` enforces correlated anti-join and no mutations | PostgreSQL integration pending |

No build/test runner was invoked per owner's directive. The comprehensive core function-by-function and all second-third TPO page coverage work remains open.


### Expiry-sweep audit/notification parity (PLACEMENTS-EXPIRY-NOTIFY-30/31)

`sweepExpiredPlacementOffers` now locks offer rows only using `FOR UPDATE SKIP LOCKED`, scopes each record through application → job → college, persists one `EXPIRED` transition and one deduped activity event, and (for active colleges only) delivers a preference-aware learner notification in the same transaction. Suspended colleges still record expiry but receive no fresh delivery. A repeated sweep cannot create a second expiry event or duplicate notification; the actor is the persisted scheduler user and the learner is the subject, never a forged impersonation. Tests: `tests/unit/chat5-placement-offer-capacity.test.ts` and two real-PostgreSQL scenarios in `tests/integration/placements-p8-offers.test.ts` (exact expiry, repeated sweep, event dedupe, recipient, opted-out delivery). The 15-minute cron schedule is an external deployment obligation, not claimed as implemented; cloud CI execution is deferred by owner.


### Offer register screen/export parity — TPO-OFFERS-URL-32 and TPO-OFFERS-EXPORT-33

The `/tpo/placements/jobs/[jobId]/offers` page now refuses repeated URL filter values rather than silently picking the first. A shared `TpoReportInvalidFilters` response explains the invalid snapshot and links to the scoped page with cleared filters. The sibling `/api/placements/tpo/jobs/[jobId]/offers/export` GET refuses repeated query keys and a query-supplied `jobId` override, so the path job remains authoritative. The CSV still routes through the same strict, college-scoped register schema and retains no-store download headers. `tests/unit/chat5-tpo-offer-url-integrity.test.ts` tests all duplicated field classes, invalid selectors, path-vs-query override denial, and both route preflights. Real browser/network acceptance remains pending under owner's no-CI directive.


### Second-third TPO pages, eight-screen parity slice and cancellation gap closure

| Case | Page/service | Coverage authored | Pending |
|---|---|---|---|
| PLACEMENTS-CANCEL-WAIT-34 | `tpo-drive-cancel-service.ts`, cancel preview | A pending durable waitlist seat blocks both the preview action and the job-row-locked cancellation; TPO sees the specific action needed rather than an unsafe cancellation. `tests/integration/db09-tpo-drive-cancel.test.ts` verifies the job/offer/seat all stay unchanged on direct POST; `tests/unit/chat5-tpo-closure-ux-boundary.test.ts` checks interlock. | Cloud DB execution |
| TPO-JOIN-TRACKER-DB-35 | `getTpoJoiningTracker` | `tests/integration/placements-p8-offers.test.ts` checks ISSUED not JOINED, accepted-but-pending exactly one, actual JOINED status and foreign-college denial | Cloud DB execution |
| TPO-OFFERS-URL-36 | offers page and export route | Query `jobId` override rejected by page and CSV, duplicate filters rejected, CSV returns safe actionable HTTP 400 text with no-store/no-sniff headers. `tests/unit/chat5-tpo-offer-url-integrity.test.ts` | HTTP/runtime execution |
| UX-TPO-DRIVE-STOP-37 | close/cancel preview | Return links increased to 44px keyboard/touch targets, blocked cases clearly surfaced. `tests/unit/chat5-tpo-second-third-page-journeys.test.ts` | Phone and keyboard browser |
| TPO-JOIN-PAGE-38 | joining page/model | Pure projection tests for issued vs accepted vs pending vs joined and visible form binding | Browser states |
| TPO-2ND-PAGE-SCOPE-39 | offers, selections, waitlist, joining, close-preview, cancel-preview, rounds, drive-day | Each page contracts TPO role guard, scoped domain read, shared heading, mobile min width, and no raw HTML injection in `tests/unit/chat5-tpo-second-third-page-journeys.test.ts`. These are source-level contracts, not full React render tests | Full loading/error/partial render and alternate role matrix |

This ledger is not yet the requested one-row-per-all-exports exhaustive matrix. Source commits were pushed to `chatgpt/chat-5-b`, with main reconciliation where safe. No CI was run under the owner's directive.


### Route-handler JSON boundary ledger (chat-5 owner queue, no CI pass yet)

Each row is an explicit mutation handler, not a blanket claim that all placement APIs are certified. They share `readTpoBulkRequestBody`'s streaming 64KiB limit, media-type checks, invalid/oversize HTTP responses, and same-origin preflight. GET routes were left read-only.

| Case | Handler and permitted action | Behaviour asserted | Coverage file |
|---|---|---|---|
| PLACEMENTS-SELECTION-BODY-41 | `POST /api/placements/tpo/jobs/[jobId]/selections` record or verify/release | Origin denial before decoding, structured 400/413/415 on POST instead of the unreachable GET catch; GET performs only the scoped read | `tests/unit/chat5-tpo-second-third-behavior.test.ts` |
| PLACEMENTS-CANCEL-BODY-42 | `POST /api/placements/tpo/jobs/[jobId]/cancel-preview` | Bounded body before `cancelTpoDriveWithPreview`, stale version and state checks remain service-owned; GET never cancels | Same |
| PLACEMENTS-JOINING-BODY-43 | `PUT /api/placements/offers/[offerId]/joining` | Bounded body before real joining/correction writes; same-origin guard before parser, no provider text | Same |
| PLACEMENTS-OFFER-REQUEST-44a | `POST /api/placements/applications/[applicationId]/offers` | Issue payload bounded before persisted eligibility/seat checks | Same |
| PLACEMENTS-OFFER-REQUEST-44b | `POST /api/placements/offers/[offerId]/actions` | Learner acceptance/decline and admin withdrawal body bounded before status/membership locks | Same |
| PLACEMENTS-OFFER-REQUEST-44c | `POST /api/placements/jobs/[jobId]/offers/bulk-withdraw` | Bulk list bounded before atomic withdrawal transaction | Same |
| PLACEMENTS-CASCADE-UNDO-BODY-45 | `POST /api/placements/tpo/offers/[offerId]/cascade-undo` | Strict confirmation and cascade UUID after bounded read; ambiguous JSON never reaches the undo service | Same |
| TPO-EXPIRY-CSV-46 | `GET /api/placements/tpo/offers/expiry` | Repeated `days` is invalid rather than silently taking the last; no-store CSV and safe clear-filter error | `tests/unit/chat5-tpo-offer-url-integrity.test.ts` |

**PLACEMENTS-CANCEL-SEASON-40** also adds an explicit same-college `FOR SHARE` on the owning placement season after locking the job row. A competing season-close transaction cannot silently change the active-season decision while the cancellation writes. `tests/unit/chat5-tpo-closure-ux-boundary.test.ts` checks lock ordering and college scope; direct PostgreSQL race coverage remains pending. The complete service/export inventory and all route role matrices remain unfinished; no local tests, build, PostgreSQL or browser were run.

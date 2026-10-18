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
| PLACEMENTS-JOIN-SM-01 | projectTpoJoiningTracker | **new** extended-state-machines test; only accepted offers, null joining is pending, joined evidence only | Real correction + actor/session revocation |
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
| tpo-joining-tracker-service and joining route | New ACCEPTED-only projection and no-evidence page contract | Other-college data isolation and real correction |
| placement-offer-expiry-sweep-service | Existing pure expiry evidence; implementation uses skipLocked | Scheduler, worker race, stale offer response, audit |
| college-retention-report-service | Uncovered | **OPEN** persisted retention evidence, wrong tenant, empty state and export |
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

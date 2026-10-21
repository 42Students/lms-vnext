# Work packet (wave 2): edit src/modules/placements/offer-service.ts

27 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-offer.md, docs/audit/gap2/lane-16/u014-tpo-job-offer-repository.md, docs/audit/gap2/lane-20/job-service.md, docs/audit/gap2/lane-8/l18-u022-tpo-offer-controller.md, docs/audit/gap2/lane-9/l17-u023-learner-offer-controller.md

## G2-13-015-016  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:25-30` helper queries expired RELEASED and external accepted window complete
- vNext now: `src/modules/placements/offer-service.ts:705-715` action checks expiry; `src/db/schema/placements.ts:1553` expiresAt, pending sweeps in separate service
- Fix: Wire scheduled expiration and external-dispute finalization with explicit parity outcomes

## G2-13-015-037  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:273-275` WITHDRAWN notification and application transition to REJECTED
- vNext now: `src/modules/placements/offer-service.ts:1014-1070` status WITHDRAWN; `src/db/schema/placements.ts:1614-1617` no REJECTED offer status
- Fix: Specify application status after offer withdrawal and exact learner notification semantics

## G2-13-015-048  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:60` 'This student is ... so they can't be selected', `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:64` 'This student already has an offer on this drive'
- vNext now: `src/modules/placements/offer-service.ts:289-297` PLACEMENT_OFFER_NOT_READY, `src/modules/placements/offer-service.ts:418-420` ACTIVE_EXISTS code
- Fix: Provide field-specific user-safe explanation for blocked issuance state instead of opaque generic code

## G2-16-014-002  [P2] GAP  facet F01  effort M
- Legacy: JobOfferRepository.java:14-16 by application and latest.
- vNext now: offer-service.ts:112-145 lookup single offer UUID.
- Fix: Restore per-application latest/history selector.

## G2-16-014-006  [P2] GAP  facet F04  effort S
- Legacy: JobOfferRepository.java:14 find all offers by application.
- vNext now: offer-service.ts:394-409 active offer read.
- Fix: Allow historical versions in read.

## G2-16-014-007  [P2] GAP  facet F04  effort S
- Legacy: JobOfferRepository.java:16 latest createdAt DESC.
- vNext now: offer-service.ts:495-507 max version during issuance.
- Fix: Sort per-app latest issuedAt DESC with stable tie-break.

## G2-16-014-010  [P2] GAP  facet F05  effort M
- Legacy: JobOfferRepository.java:21-23 learner offers across applications used for held CTC.
- vNext now: offer-service.ts:480-493 loadPlacementHeldOfferFacts.
- Fix: Compare learner/college scope and held-status CTC calculation.

## G2-16-014-017  [P2] GAP  facet F10  effort M
- Legacy: JobOfferRepository.java:14-23 read by application, latest, job and learner.
- vNext now: offer-service.ts:71-145; tpo-drive-offer-register-service.ts:19-25 support subset.
- Fix: Add full typed scoped read methods.

## G2-16-014-041  [P2] GAP  facet F23  effort M
- Legacy: JobOfferRepository.java:18-23 two aggregate scopes.
- vNext now: tpo-drive-offer-register-service.ts:23-25 job and offer-service.ts:480-493 learner facts.
- Fix: Reconcile scopes, eligible statuses and CTC held rules.

## G2-20-012-020  [P2] GAP  facet F10  effort S
- Legacy: Student offer acceptance cascades other applications with preview `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/JobService.java:152-173`
- vNext now: New offer service includes placement-cascade-policy and independent held offer facts `src/modules/placements/offer-service.ts:48-57`
- Fix: Verify preview and commit classify same sibling list under a transaction

## G2-18-022-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:15-17 /api/v1/tpo/offers endpoints for per-drive TPO
- vNext now: src/modules/placements/offer-service.ts:267-617 issue/action and src/modules/placements/tpo-offer-lifecycle-service.ts:36-60 TPO action services per scoped job
- Fix: Map legacy per-offer paths to new scoped job/app IDs, preserve Offers tab deep links

## G2-18-022-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:31-33 rule tags HOLDS_THIS,CLEAR,ALLOWED,BLOCKED,NOT_COUNTED
- vNext now: src/modules/placements/offer-service.ts:449-475 checks held offers/college rules inside issue, no persisted legacy rulesCheck badge
- Fix: Expose read-only per-row rules preview and exact tooltips

## G2-18-022-006  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:35-41 response deadline SOON/LATER/OVERDUE/NONE badges
- vNext now: src/modules/placements/offer-service.ts:617-1018 expiry validation, offer.expiresAt
- Fix: Show within48h/time up/respond by badges and correct IST countdown

## G2-18-022-008  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:47-52 selection request applicationId,roleOptionName,ctcLpa,kind
- vNext now: src/modules/placements/offer-service.ts:267-310 issueOffer input applicationId, roleTitle,annualCtcInr,kind, letterUrl
- Fix: Map roleOptionName to roleTitle and LPA to INR; preserve nullable initial CTC

## G2-18-022-010  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:260-263 CTC/Fixed/Variable LPA and Joining columns
- vNext now: src/modules/placements/offer-service.ts:1459-1542 normalized annualCtcInr and joining outcomes
- Fix: Present LPA numeric formatting and both fixed/variable components if present

## G2-18-022-011  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:57-71 multiple checklist filters, client side
- vNext now: src/modules/placements/offer-service.ts:1459-1542 offers listing scoped by job, no all checklist filters in service
- Fix: Support combined multi-select filters without silently filtering out selections

## G2-18-022-013  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:95-102 record selection default OFFER, first role option + CTC, no student selected
- vNext now: src/modules/placements/offer-service.ts:267-310 issue offer requires validated application and published drive
- Fix: Provide selection modal defaults and candidate search priorities

## G2-18-022-023  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:227-248 preview waitlisted rank and skip reasons before commit
- vNext now: src/modules/placements/offer-service.ts:423-447 checks offer seat and pending waitlist reservation
- Fix: Ensure waitlist preview/offer-to-next flow shows ranks and skipped causes

## G2-18-022-031  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:49-75 recordSelection only when open status and no active offer
- vNext now: src/modules/placements/offer-service.ts:393-420 rejects active and replays identical ISSUED input idempotently
- Fix: Provide selected state and idempotent draft selection upsert

## G2-18-022-032  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:100-106 release only SELECTED and no second notice
- vNext now: src/modules/placements/offer-service.ts:411-417 identical ISSUED replay accepted as idempotent
- Fix: Do not send duplicate notice on replay and refuse re-release of expired/withdrawn offers

## G2-18-022-035  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:54-64 duplicate live offer and invalid learner state errors
- vNext now: src/modules/placements/offer-service.ts:393-420 NOT_READY/ACTIVE_EXISTS typed errors
- Fix: Distinguish already selected, existing issued, and closed applicant errors in UI

## G2-18-022-036  [P2] GAP  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:105-116 blocked, expired, withdrawn cannot release again
- vNext now: src/modules/placements/offer-service.ts:329-390 no persisted pending selection release state
- Fix: Show disabled verify action with per-row reason and retry after eligibility change

## G2-18-022-038  [P2] GAP  facet F14  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:284 Letter 'Open' safe link or Pending or Invalid link
- vNext now: src/modules/placements/offer-service.ts:267-617 offer evidence stored separate/URL
- Fix: Render explicit Pending/Invalid/Open letter states

## G2-18-022-039  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:159-166 outbox OFFER_RELEASED to learner
- vNext now: src/modules/placements/offer-service.ts:568-608 event + delivered in-app notification inside issuance transaction
- Fix: Match learner notification wording/visibility and dedup at release point

## G2-18-022-043  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:24-28 'Withdrawn by company'/'Reversed' status words
- vNext now: src/modules/placements/tpo-offer-lifecycle-model.ts:8-10 action WITHDRAW and src/modules/placements/offer-service.ts:617-1018 status WITHDRAWN
- Fix: Use exact old status badge copy and separate company vs staff actor

## G2-18-022-052  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:86-90 letterUrl text persisted on offer
- vNext now: src/modules/placements/offer-service.ts:267-617 issue payload/status ledger plus storage evidence
- Fix: Map letter URL to private evidence and validate safe download path

## G2-17-023-032  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:188-193 TPO bell to /tpo/drives/:jobId?tab=offers and OFFER_ACCEPTED/DECLINED audit
- vNext now: src/modules/placements/offer-service.ts:893-1010 activity event and placement notification record
- Fix: Verify recipient TPO bell and exact deep-link/action event taxonomy.

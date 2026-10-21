# Work packet: edit src/modules/placements/offer-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/job-offer.md, docs/audit/gap2/lane-8/l18-u022-tpo-offer-controller.md, docs/audit/gap2/lane-9/l17-u023-learner-offer-controller.md, docs/audit/gap2/lane-6/job-controller.md

## G2-13-015-001  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:18-29`,35-40 offer record is separated from job_application.status; initial SELECTED before verified RELEASED
- vNext now: `src/db/schema/placements.ts:1522-1535` stores versioned offer with initial status ISSUED, `src/modules/placements/offer-service.ts:267-297` issue flow
- Fix: Introduce explicitly persisted pre-release selection/verification decision or map legacy SELECTED accurately to separate vNext selection table

## G2-13-015-024  [P1] GAP  facet F08  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:98-167` verifyAndRelease sets RELEASED and OFFERED and queues learner notification
- vNext now: `src/modules/placements/offer-service.ts:509-550` issues ISSUED directly and writes offer history/notification thereafter
- Fix: Separate selection record success from release success; ensure only release notifies learner

## G2-13-015-027  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:49-76` record selection writes SELECTED with row lock, may omit letter
- vNext now: `src/modules/placements/offer-service.ts:267-529` issue offer requires SHORTLISTED screening and completed rounds and immediately writes ISSUED
- Fix: Provide selection-first workflow and separate release transaction guarded by TPO verification

## G2-13-015-028  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:98-165` release changes underlying legacy JobApplication to OFFERED
- vNext now: `src/db/schema/placements.ts:993-995` vNext application status restricted SUBMITTED/WITHDRAWN; `src/modules/placements/offer-service.ts:509-539` writes offer status history
- Fix: Translate OFFERED via offer table status/history not application status; ensure learner Offers discoverability

## G2-13-015-034  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:49-75` selects after open application stages, no active SELECTED/PENDING/RELEASED/ACCEPTED offer
- vNext now: `src/modules/placements/offer-service.ts:289-297` screening SHORTLISTED required and `src/modules/placements/offer-service.ts:403-420` active ISSUED/ACCEPTED only
- Fix: Map open stages and initial selection eligibility separately from offer issuance screening rules

## G2-13-015-062  [P1] GAP  facet F23  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobOffer.java:69-71` RELEASED vs SELECTED distinct; vNext ISSUED only active pre-response
- vNext now: `src/modules/placements/offer-service.ts:509-529` immediately issues offer from shortlisted state
- Fix: Do not treat vNext ISSUED as direct equivalent to legacy pre-release SELECTED; add verification workflow

## G2-18-022-002  [P1] GAP  facet F02  effort L
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:298-308 top toolbar Record selection, Import, Verify and release, Attach letters
- vNext now: src/modules/placements/offer-service.ts:267-617 issue offer directly, service has no persisted SELECTED draft state
- Fix: Build pre-release selection staging and the four top toolbar actions

## G2-18-022-004  [P1] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:24-28 statuses SELECTED,PENDING_VERIFICATION,RELEASED,ACCEPTED,DECLINED,EXPIRED,WITHDRAWN,REVOKED
- vNext now: src/modules/placements/tpo-offer-lifecycle-model.ts:20 expectedStatus ISSUED/ACCEPTED; src/modules/placements/offer-service.ts:267-617 issues ISSUED directly
- Fix: Restore visible selection/verification states or explicit state mapping badges

## G2-18-022-009  [P1] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:63-67 letterUrl attach/remove
- vNext now: src/modules/placements/offer-service.ts:267-617 direct issue with offer letter details, no standalone attach selection flow shown
- Fix: Offer letter attach/replace/remove for selected and issued offers with audited receipt

## G2-18-022-022  [P1] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/OffersTab.js:190-195 verify-all Modal confirm title + no undo copy
- vNext now: src/modules/placements/offer-service.ts:267-617 issue directly; no SELECTED release modal
- Fix: Restore confirm dialog with exact release impact and acknowledgement

## G2-18-022-024  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:54-61 POST record-selection persists SELECTED before release
- vNext now: src/modules/placements/offer-service.ts:267-617 directly creates ISSUED offer from shortlist
- Fix: Separate recordSelection and verifyAndRelease transaction boundaries

## G2-18-022-025  [P1] MISSING  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:63-68 attach/remove letter URL as standalone POST
- vNext now: src/modules/placements/offer-service.ts:267-617 single issue path and offer action, no mapped attach method
- Fix: Add letter lifecycle endpoint with audit and pending safe state

## G2-18-022-026  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoOfferController.java:70-74 verify release transitions SELECTED→RELEASED and application OFFERED
- vNext now: src/modules/placements/offer-service.ts:267-617 direct ISSUED, application remains SUBMITTED in normalized model
- Fix: Publish normalized status mapping with correct learner offer visibility

## G2-18-022-049  [P1] GAP  facet F21  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:119-139 held-offer college rules, dream uplift, blocked release
- vNext now: src/modules/placements/offer-service.ts:449-475 college debarment and held-offer policy, dream marker constraint noted
- Fix: Trace dream exemption logic and present exact blocked policy explanation

## G2-18-022-054  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:49-75 recordSelection before release
- vNext now: src/modules/placements/offer-service.ts:267-617 issues offer directly with no SELECTED state
- Fix: Treat missing interim selection as explicit parity blocker rather than renamed status

## G2-17-023-030  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:172-193 JobServiceImpl.respondToOffer then offer ACCEPTED/DECLINED and bell/audit
- vNext now: src/modules/placements/offer-service.ts:718-1015 transactional response, placementOfferStatusHistory and activity
- Fix: Verify cascade/app status mapping and preserve learner/company/TPO notification semantics.

## G2-17-023-046  [P1] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:190-193 bell to TPO on accept/decline
- vNext now: src/modules/placements/offer-service.ts:893-1010 activity and application status delivery
- Fix: Check TPO + company notification recipients/content on real acceptance and decline.

## G2-13-015-021  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:58-65` error 'Application not found', 'This student already has an offer on this drive'
- vNext now: `src/modules/placements/offer-service.ts:418-420` PLACEMENT_OFFER_ACTIVE_EXISTS and `src/modules/placements/offer-service.ts:103-107` PLACEMENT_APPLICATION_NOT_FOUND
- Fix: Map legacy selection error text to user-facing translation with no ambiguous codes

## G2-13-015-022  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:103-107` 'This offer is ... so it can't be released again'
- vNext now: `src/modules/placements/offer-service.ts:289-306` PLACEMENT_OFFER_NOT_READY, `src/modules/placements/offer-service.ts:705-715` typed transition expiry errors
- Fix: Preserve transition-specific failure reasons including selected/released vs expired statuses

## G2-6-027-028  [P2] GAP  facet F08  effort S
- Legacy: Offer response 'Offer accepted' or 'Offer declined'; preview 'Preview generated' (JobController.java:699-700,721-725).
- vNext now: vNext returns {offer} or typed preview without legacy message (offers/[offerId]/actions/route.ts:30-38; offer-service.ts:1126-1137).
- Fix: Match offer confirmation copy and preview result wording in UI.

# Work packet: edit src/components/placements/learner-placement-offers.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-offers.md, docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-9/l17-u023-learner-offer-controller.md

## G2-13-005-070  [P1] GAP  facet F20  effort L
- Legacy: Old accepts status RELEASED, vNext ISSUED and tracks expired date (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:27-30`)
- vNext now: New recognizes ISSUED and explicit expiry; statuses other than ISSUED not respondable (`src/components/placements/learner-placement-offers.tsx:34-42`)
- Fix: Document RELEASED→ISSUED mapping and exact expired/withdrawn transitions.

## G2-13-005-074  [P1] GAP  facet F22  effort L
- Legacy: Old offer API fields ctcLpa, respondBy, respondedAt, logo, roleOption, RELEASED (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:10-29`)
- vNext now: New offers fields annualCtcInr, expiresAt, issuedAt, kind, joining, ISSUED (`src/components/placements/learner-placement-offers.tsx:30-59`)
- Fix: Create field/status migration crosswalk; ensure historical responses, logo and timestamps not lost.

## G2-18-011-014  [P1] GAP  facet F04  effort L
- Legacy: Legacy offer response accepts OFFERED only; maps accepted HIRED and declined REJECTED (`JobServiceImpl.java:1168-1196`).
- vNext now: New offer statuses ISSUED/ACCEPTED/DECLINED separate from application status (`learner-placement-offers.tsx:30-59`; `placements.ts:973-1059`).
- Fix: Define old HIRED/REJECTED vs new offer+joining state crosswalk, preserve downstream triggers.

## G2-18-011-047  [P1] GAP  facet F12  effort M
- Legacy: Legacy offer decline from OFFERED sets REJECTED, clears offer letter and remains visible (`JobServiceImpl.java:1025-1050`).
- vNext now: New offer status DECLINED separate, application remains SUBMITTED unless withdrawn (`learner-placement-offers.tsx:30-59`; `placements.ts:993-1019`).
- Fix: Ensure declined offer hides valid letter/action while retaining history and application stage.

## G2-13-005-031  [P2] GAP  facet F07  effort S
- Legacy: Old response error text from API, fallback Could not accept/decline (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:31-45`)
- vNext now: New maps status via learnerOfferActionErrorMessage and generic Could not update offer title (`src/components/placements/learner-placement-offers.tsx:175-205`)
- Fix: Preserve action-specific fallback and contextual cause.

## G2-17-023-023  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoOfferService.java:177-179 exact 'The offer response deadline has passed'
- vNext now: src/components/placements/learner-placement-offers.tsx:423-427 longer informational deadline copy
- Fix: Use original exact deadline response feedback in inline and toast contexts.

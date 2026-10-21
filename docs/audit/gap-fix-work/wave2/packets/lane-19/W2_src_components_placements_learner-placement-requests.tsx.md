# Work packet (wave 2): edit src/components/placements/learner-placement-requests.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l14-u023-learner-request-controller.md, docs/audit/gap2/lane-12/placement-cell.md

## G2-14-023-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:58 — refusals 400 with sentence, missing 404.
- vNext now: src/components/placements/learner-placement-requests.tsx:101-107 — friendly error handling, client mutates new route.
- Fix: Preserve actionable sentence instead of code.

## G2-12-005-016  [P2] GAP  facet F04  effort S
- Legacy: Offers deduped by jobId and only status RELEASED available for extension `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:89-90`
- vNext now: VNext offer option keyed offerId with expiry and formal ISSUED/ACCEPTED statuses `src/components/placements/learner-placement-requests.tsx:58-64`
- Fix: Document new offer lifecycle mapping and eligible extension selections

## G2-12-005-051  [P2] GAP  facet F12  effort S
- Legacy: Offer extension request only for RELEASED offers `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:89-90,243-250`
- vNext now: Uses normalized offers and deadline to show extension actions `src/components/placements/learner-placement-requests.tsx:58-64`
- Fix: Map released-offer eligibility and deadline rules explicitly

## G2-12-005-072  [P2] GAP  facet F18  effort S
- Legacy: `Waiting for the placement cell` and `Not approved` status strings `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:21-21`
- vNext now: Specialized request helper matches wording; general list does not `src/components/placements/learner-placement-requests.tsx:66-69`
- Fix: Reuse legacy status formatter for general requests

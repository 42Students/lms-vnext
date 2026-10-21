# Work packet: NEW / MISSING items from docs/audit/gap2/lane-13/l17-u023-learneroffer.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l17-u023-learneroffer.md

## G2-17-23-002  [P1] GAP  facet F01 Route and URL  effort M
- Legacy: LC:20–33 POST /api/v1/learner/offers/{numeric offerId}/respond
- vNext now: VA:15–29 POST /api/placements/offers/{UUID offerId}/actions
- Fix: Document old route→new route, int→UUID ID crosswalk and update any remaining old deep links/clients; do not expose unsafe numeric alias

## G2-17-23-015  [P1] GAP  facet F04 Request ID  effort M
- Legacy: LC:32–33 PathVariable Long offerId; TS:172–173 finds offer by Long
- vNext now: VA:29–35 parses offer UUID VV:1117–1118; VS:624–633 loads UUID offer context
- Fix: Add explicit legacy numeric↔UUID offer ID reconciliation in migration/integration ledger; reject malformed identifiers before DB

## G2-17-23-016  [P1] GAP  facet F04 Accept input  effort S
- Legacy: LC:33,40 reads body Map<String,Boolean> accept and treats only Boolean.TRUE as accept
- vNext now: VV:1165–1194 discriminated union action ACCEPT/DECLINE/WITHDRAW; VC:170–175 sends action
- Fix: Make accept intent explicit and reject absent/nonboolean legacy accept; never silently convert malformed payload into decline

## G2-17-23-018  [P1] GAP  facet F04 Status names  effort M
- Legacy: JO:69–75 RELEASED/ACCEPTED/DECLINED and acceptanceChannel IN_APP
- vNext now: VDB:1531–1536 ISSUED/ACCEPTED/DECLINED, VS:735–743 sets accepted
- Fix: Crosswalk RELEASED→ISSUED and legacy SELECTED/PENDING_VERIFICATION separately; never conflate unpublished selection with issued offer

## G2-17-23-020  [P1] GAP  facet F04 Cascade identifier  effort M
- Legacy: TS:184–187 sets random UUID string on accept; JO:85–87 cascade_id String
- vNext now: VS:764–777 UUID cascadeId stored in offer history, returned with response VS:926, VDB:1556/1694
- Fix: Verify cascade correlation is durable/readable from both new offer and status-history records and historical reports, not just request result

## G2-17-23-026  [P1] GAP  facet F06 Missing accept  effort S
- Legacy: LC:40 Boolean.TRUE.equals(body.get("accept")) means {} silently becomes false and declines
- vNext now: VV:1165–1183 requires action discriminator; VA:34 parses JSON
- Fix: Retain vNext strict validation; document legacy bug, never provide a compatibility adapter that interprets missing accept as DECLINE

## G2-17-23-036  [P1] GAP  facet F07 Not-own application  effort M
- Legacy: JS:1186–1189 treats missing/foreign application as "Application not found" to avoid enumeration; LC:49–51 maps IllegalArgumentException to 404
- vNext now: VS:642–652 requireLearnerOfferOwner and scope; error mapped centrally
- Fix: Ensure denial for foreign offer uses indistinguishable response timing/status from nonexistent offer and no app ID leaks

## G2-17-23-037  [P1] GAP  facet F07 Already HIRED  effort S
- Legacy: JS:1210–1218 returns explicit "You already have an accepted offer (HIRED)..." conflict as IllegalArgumentException, LC:49–51 maps to 404
- vNext now: VS:834–836 checks sibling ACCEPTED and throws PLACEMENT_OFFER_ACTIVE_EXISTS; VE:3–8 maps generic error
- Fix: Use 409 business conflict (not legacy erroneous 404) and display appropriate "already accepted another offer" remediation

## G2-17-23-038  [P1] GAP  facet F07 Alternative response API  effort S
- Legacy: JC:717–720 explicitly rejects nonboolean accept with HTTP 400 "accept (boolean) is required"
- vNext now: LC:40 silently interprets missing field as decline; VA:34 strictly validates action
- Fix: Canonicalize on strict schema so old controller and alternative controller cannot produce opposite outcome for malformed body

## G2-17-23-047  [P1] GAP  facet F10 Side effects application  effort L
- Legacy: JS:1195–1256 OFFERED→HIRED on accept, OFFERED→REJECTED on decline; fixed rejection reason, clears letter on decline, cancels interviews
- vNext now: VS:735–785 updates placementOffers ISSUED→ACCEPTED and creates joining outcome; VS:939–979 ISSUED→DECLINED; VDB:993–995 app status remains separate SUBMITTED model
- Fix: Document application-vs-offer state ownership; ensure all reports and learner timeline reflect accepted/declined decision without legacy HIRED/REJECTED column

## G2-17-23-048  [P1] GAP  facet F10 Cascade other applications  effort L
- Legacy: JS:1325–1420 locks other active applications; OFFERED→REJECTED, other eligible statuses→WITHDRAWN; may keep dream/uplift cases
- vNext now: VS:856–891 considers sibling SUBMITTED applications and withdraws by placement policy
- Fix: Crosswalk legacy six active statuses and statuses now modeled as SUBMITTED; prove all eligible sibling applications, not just one subset, transition correctly

## G2-17-23-049  [P1] GAP  facet F10 Cascade other offers  effort M
- Legacy: JS:1259–1268 closes all RELEASED offers on answered app; JS:1414 closes pending sibling offers DECLINED
- vNext now: VS:816–854 declines other ISSUED OFFER offers blocked by policy, keeps allowed LOI/internship cases
- Fix: Verify one-offer-per-application and LOI behavior, ensure accepted offer and sibling offer histories converge without stale open offer

## G2-17-23-051  [P1] GAP  facet F10 Offer history  effort M
- Legacy: TS:180–187 updates raw offer; JS:1238–1241 publishes ApplicationStatusChangedEvent and JS:1259–1268 closes released offers
- vNext now: VS:764–777,968–980 inserts placementOfferStatusHistory, VDB:1672–1721 stores typed transition history
- Fix: Ensure offer state, application history, timeline and cascade identifier are consistently joined; avoid double historical events on replay

## G2-17-23-052  [P1] GAP  facet F10 Audit trail  effort M
- Legacy: TS:188–195 audit.bell OFFER_ACCEPTED/DECLINED and audit.log actor STUDENT/learnerId + offerId
- vNext now: VS:893–925,982–1010 records PLACEMENTS_OFFER_RESPONDED with response metadata and sends in-app learner event
- Fix: Crosswalk old TPO bell/audit activity to vNext TPO inbox and learner activity, preserving college/actor/job/application/offer IDs

## G2-17-23-055  [P1] GAP  facet F11 Module gate  effort L
- Legacy: LC:34–41 checks role, TS:172–180 delegates; no placement-module paid/participation check shown in this direct path
- vNext now: VG:48–153 requires enabled Placements module + eligible participation + active enrollment/section and context
- Fix: Product decision: when module/eligibility revoked after offer release, provide secure access to legally required pending response instead of silent lockout (or document intentional block)

## G2-17-23-056  [P1] GAP  facet F11 Status-before-ownership leak  effort M
- Legacy: TS:173–179 tests offer existence, RELEASED status and response deadline before JS:1186–1189 enforces learner ownership
- vNext now: VS:642–652 checks owner before transaction status; VS:632–633 loads context first
- Fix: Avoid offering an ID/status enumeration oracle in any compatibility route; require owner-scope before revealing offer state or deadline

## G2-17-23-058  [P1] GAP  facet F12 State prerequisite  effort M
- Legacy: TS:173–180 only RELEASED offer and nonexpired deadline may respond; JS:1191–1196 requires application OFFERED
- vNext now: VS:700–733 only ISSUED may first ACCEPT/DECLINE, with expectedStatus="ISSUED" passed VA:36
- Fix: Explicitly map old offer/application dual states to new issued state; detect inconsistent legacy-migrated rows before accepting

## G2-17-23-061  [P1] GAP  facet F12 One accepted offer  effort M
- Legacy: JS:1197–1218 checks any other HIRED and locks learner on accept before working
- vNext now: VS:665–679 locks membership and VS:834–836 checks sibling ACCEPTED
- Fix: Confirm internship/LOI policy exception and cross-college accepted offers; show clear conflict rather than generic error

## G2-17-23-062  [P1] GAP  facet F12 Dream/uplift  effort L
- Legacy: TS:21–32 documents original broad-withdraw gap; JS:1371–1373 now keeps policy-allowed non-OFFERED siblings
- vNext now: VS:788–815 applies acceptedCountsAsPlaced, internship, maxHeldOffers and upliftPct, VS:873–875 filters siblings
- Fix: Create explicit old/new decision matrix for Dream, internship, LOI, placement category and uplift; avoid accidental blanket withdrawal

## G2-17-23-077  [P1] GAP  facet F19 Response workload  effort M
- Legacy: LC:32–41 single offer action but TS:180 invokes JS:1168–1256 and JS:1325–1420 may visit every active application+interviews
- vNext now: VS:816–891 locks/scans sibling offers and applications within transaction
- Fix: Benchmark worst-case student with many offers/interviews and ensure consistent lock ordering, bounded work, no timeout-induced partial writes

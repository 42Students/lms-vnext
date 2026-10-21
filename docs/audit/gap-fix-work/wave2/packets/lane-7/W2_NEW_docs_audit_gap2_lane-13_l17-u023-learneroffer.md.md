# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-13/l17-u023-learneroffer.md

24 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l17-u023-learneroffer.md

## G2-17-23-004  [P2] GAP  facet F01 Alternate controller  effort M
- Legacy: JC:710–724 also exposes /api/v1/jobs/applications/{applicationId}/offer-response/{learnerId}, returns application rather than offer
- vNext now: VA:15–38 one offer-ID action endpoint; no equivalent old application route here
- Fix: Audit/update any consumers of old application-level response, map applicationId to specific current offer before calling new endpoint

## G2-17-23-007  [P2] GAP  facet F02 Action hierarchy  effort M
- Legacy: OC:83–87 displays Accept offer, Decline, Offer letter in that order for RELEASED offer
- vNext now: VC:434–463 presents Accept offer, Decline offer, optional extension; offer letter at VC:341–347
- Fix: Put primary response actions and letter affordance in legacy sequence without hiding critical expiry/extension information

## G2-17-23-009  [P2] GAP  facet F03 Button copy  effort S
- Legacy: OC:84–85 primary label Accept offer; danger label Decline
- vNext now: VC:434–456 primary Accept offer and secondary Decline offer
- Fix: Match exact decline button text "Decline" and danger treatment if literal clone requested

## G2-17-23-010  [P2] GAP  facet F03 Status chip  effort S
- Legacy: OC:10–14 maps RELEASED to "Waiting for your reply"; action visible only RELEASED OC:27
- vNext now: VC:306–318 displays modern ISSUED status chip/label and expiry notice VC:419–431
- Fix: Preserve "Waiting for your reply" in learner-visible chip for actionable ISSUED state, with explicit expiry variant

## G2-17-23-011  [P2] GAP  facet F03 Offer letter  effort S
- Legacy: OC:86 has "Offer letter" Button target=_blank noopener noreferrer
- vNext now: VC:341–347 renders "View offer letter" anchor, differing action styling/new-tab semantics
- Fix: Match legacy button and new-tab behavior while retaining safe URL allowlist and rel protection

## G2-17-23-012  [P2] GAP  facet F03 Urgent clock  effort S
- Legacy: OC:27–29 and 75 uses red class when fewer than 24 hours to respond
- vNext now: VT:19–26 flags SOON when <=48 hours; VC:428–431 says within 48 hours
- Fix: Retain critical 24-hour red deadline treatment; optional 48-hour warning can remain secondary

## G2-17-23-013  [P2] GAP  facet F03 Decline explanation  effort S
- Legacy: OC:115–119 decline modal says "This cannot be undone. The company and the placement cell are told."
- vNext now: VC:538–563 says response officially recorded and cannot be undone in Learner workspace, optional reason field
- Fix: Include explicit legacy consequence text if backed by notifications; avoid promising immediate company notice without delivery evidence

## G2-17-23-014  [P2] GAP  facet F03 Acceptance impact labels  effort M
- Legacy: OC:56–60 groups Withdrawn, Other offers declined, You stay in with counts and explanation
- vNext now: VS:1197–1202 emits withdrawn/declined/stayed arrays and VC:584–624 presents newer impact labels
- Fix: Map arrays to exact three headings and explanatory sentences/counts; show "Nothing else changes" when empty

## G2-17-23-017  [P2] GAP  facet F04 Response body  effort M
- Legacy: LC:33–41 responds with raw serialized JobOffer (JO:29–118), 200 OK
- vNext now: VA:30–38 responds {offer} with vNext row + cascadeId on accept (VS:926)
- Fix: Specify response shape and DTO projection for any API callers, avoid returning internal relational fields or unneeded identifiers

## G2-17-23-019  [P2] GAP  facet F04 Response timestamp  effort S
- Legacy: TS:181–187 uses LocalDateTime.now() respondedAt, JO:105–106 local date-time
- vNext now: VS:698,739–743,941–947 uses lockedNow in timestamptz, VDB:1579–1581
- Fix: Normalize UTC event instant and format in IST for learner; avoid legacy timezone-free string causing shifted deadlines

## G2-17-23-021  [P2] GAP  facet F04 Offer pay/terms  effort M
- Legacy: JO:38–67 includes LOI/OFFER, roleOptionName, ctc/fixed/variable/bonus LPA, joiningDate, respondBy, letterUrl
- vNext now: VDB:1532–1563 roleTitle, INR annual CTC, LPA breakdown, joining, expiresAt, letter
- Fix: Document LPA→INR conversion/nullable fields and maintain placement letter, kind, joining, response date in API client view

## G2-17-23-032  [P2] GAP  facet F07 No principal/role  effort M
- Legacy: LC:34–39 throws AccessDeniedException "Only students can respond to offers"
- vNext now: VG:48–59 requires active learner membership; VS:642–652 requires ownership and placements.read
- Fix: Map 401 vs 403 appropriately; keep learner-safe account/role error, avoid exposing current offer status to unauthorized role

## G2-17-23-033  [P2] GAP  facet F07 Unknown offer  effort S
- Legacy: TS:172–173 throws IllegalArgumentException "Offer not found"; LC:49–51 maps to 404 {error:message}
- vNext now: VS:690–694 throws PLACEMENT_OFFER_NOT_FOUND, VA:39–43 uses apiErrorResponse
- Fix: Render friendly "Offer not found" / return to offers; do not echo arbitrary internal messages or reveal cross-tenant resource

## G2-17-23-034  [P2] GAP  facet F07 Wrong status  effort S
- Legacy: TS:174–176 throws "This offer can no longer be responded to (current status: X)"; LC:44–46 409
- vNext now: VS:700–703,729–733,933–936 uses PLACEMENT_OFFER_INVALID_TRANSITION, VE:3–8 maps 409 to refresh guidance
- Fix: Explain status changed/refresh rather than raw enum or state internals; keep 409 and accessible retry path

## G2-17-23-035  [P2] GAP  facet F07 Past deadline  effort M
- Legacy: TS:177–179 "The offer response deadline has passed"; LC:44–46 409
- vNext now: VS:705–715 PLACEMENT_OFFER_EXPIRED; VE:3–5 generic "changed or expired"
- Fix: Surface deadline-specific code and exact factual explanation, show recorded date/time in IST and disable actions

## G2-17-23-039  [P2] GAP  facet F07 Optimistic race  effort M
- Legacy: JC:728–738 alternative route maps optimistic locking to 409 with "This record was modified by someone else. Please refresh and try again."; LC only locally handles IllegalState/IllegalArgument
- vNext now: VS:664–688 locks membership+offer and VA:39–43 central error
- Fix: Map update conflicts from learner offer route consistently to 409 refresh/retry and verify no generic 500 in race

## G2-17-23-041  [P2] GAP  facet F08 Response success JSON  effort S
- Legacy: LC:41 uses ResponseEntity.ok(JobOffer), no message/envelope
- vNext now: VA:38 returns {offer}; VC:178–196 treats any 2xx as success, refreshes list
- Fix: Define stable typed success envelope and make legacy-integrating clients validate recorded state instead of assuming raw JobOffer

## G2-17-23-042  [P2] GAP  facet F08 Error toast  effort S
- Legacy: OC:40–42 fallback "Could not accept"/"Could not decline", optionally server errorText
- vNext now: VC:197–206 uses title "Could not update offer" and VE:3–8 status-specific generic descriptions
- Fix: Review exact copy against legacy catalogue and retain action-specific heading while not echoing secrets/server stack

## G2-17-23-044  [P2] GAP  facet F09 Accept modal  effort M
- Legacy: OC:89–113 Ant Modal, dynamic title, "Yes, accept" and Cancel, blocking overlay while busy, impact and rules link
- vNext now: VC:570–624 ConfirmDialog with impact, "Yes, accept" and "Keep offer pending"
- Fix: Compare modal width/spacing/title/footer/cancel text and legacy impact group order; retain safe pending/preview gate

## G2-17-23-045  [P2] GAP  facet F09 Decline modal  effort M
- Legacy: OC:115–119 "Decline X's offer?" + "This cannot be undone...", danger confirm, no textarea
- vNext now: VC:538–565 decline modal includes optional reason/CTC and new long description
- Fix: Restore exact legacy heading/consequence, preserve optional vNext reason as supplemental field, match danger button and focus

## G2-17-23-065  [P2] GAP  facet F13 Session expiry/offline  effort M
- Legacy: LC:34–39 global auth check fails if no principal; frontend OC:40–42 shows generic error
- vNext now: VG:48–81 denies stale sessions; VE:3–8 maps 401/403/404 to safe account notice
- Fix: Show sign-in/retry navigation on 401 and distinguish transient network from expired login without revealing offer details

## G2-17-23-071  [P2] GAP  facet F15 Offer expiry job  effort M
- Legacy: JR:25–26 queries RELEASED older than deadline; SJ:72–73 runs expireOverdueOffers every 15 minutes
- vNext now: VDB:1615–1617 includes EXPIRED state; vNext expiry processing lives in separate placement expiry sweep service
- Fix: Verify only ISSUED at/past timestamp expires; atomic expiry versus accept race; tie into learner notifications and audit

## G2-17-23-075  [P2] GAP  facet F18 Wording acceptance  effort S
- Legacy: OC:36–42 exactly "Congratulations! You accepted X's offer.", "Offer declined", "Could not accept"/"Could not decline"
- vNext now: VC:182–206 preserves success headings, collapses failures to "Could not update offer"
- Fix: Keep success wording exact, add action-specific failure context with safe status mapping

## G2-17-23-076  [P2] GAP  facet F18 Wording errors  effort S
- Legacy: LC:38, TS:175/178 includes raw "Only students...", "current status", "deadline has passed"; LC:44–51 returns string in error
- vNext now: VE:3–8 client maps codes to generic refresh/account message
- Fix: Maintain a reviewed machine-code→friendly copy table; avoid raw status leakage and 404 on business-rule conflict

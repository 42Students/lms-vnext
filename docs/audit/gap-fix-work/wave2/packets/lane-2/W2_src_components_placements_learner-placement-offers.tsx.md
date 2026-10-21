# Work packet (wave 2): edit src/components/placements/learner-placement-offers.tsx

36 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-offers.md, docs/audit/gap2/lane-18/job-service-impl.md, docs/audit/gap2/lane-9/l17-u023-learner-offer-controller.md

## G2-13-005-008  [P2] MISSING  facet F03  effort M
- Legacy: Offer card begins with 44px company logo/avatar, company name and linked role (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:63-70`)
- vNext now: New offer row shows uppercase company text and role title, no logo avatar (`src/components/placements/learner-placement-offers.tsx:280-304`)
- Fix: Render existing company logo/initial fallback 44px beside identity.

## G2-13-005-009  [P2] GAP  facet F03  effort M
- Legacy: Role title directly links to legacy `/learn/my-placements/jobs/{jobId}` (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:65-69`)
- vNext now: New row links View related application separately; role title not link (`src/components/placements/learner-placement-offers.tsx:285-304`)
- Fix: Preserve job-detail link from visible role title.

## G2-13-005-010  [P2] GAP  facet F03  effort S
- Legacy: Status chip says Waiting for your reply for RELEASED (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:10-14`)
- vNext now: New status badge says Issued (`src/components/placements/learner-placement-offers.tsx:306-318`)
- Fix: Map ISSUED state to legacy user wording Waiting for your reply.

## G2-13-005-011  [P2] GAP  facet F03  effort S
- Legacy: Old chip EXPIRED: Expired: no reply in time (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:10-14`)
- vNext now: New expired ISSUED is rendered as status text and alert (`src/components/placements/learner-placement-offers.tsx:419-427`)
- Fix: Display explicit expiry status wording while keeping stored status unchanged.

## G2-13-005-012  [P2] GAP  facet F03  effort M
- Legacy: Old offer facts in <dl> labels CTC, Joining, Reply by/Accepted/Answered (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:72-77`)
- vNext now: New paragraphs show response deadline and joining, separate CTC inline role text (`src/components/placements/learner-placement-offers.tsx:293-303`)
- Fix: Rebuild two-column label/value facts layout in card.

## G2-13-005-013  [P2] GAP  facet F03  effort S
- Legacy: Legacy Offer letter is a Button opened target blank rel noopener (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:83-87`)
- vNext now: New View offer letter is text anchor with rel noopener but no target blank (`src/components/placements/learner-placement-offers.tsx:341-347`)
- Fix: Match button appearance and target=_blank behavior for official letter.

## G2-13-005-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy CTC from ctcLpa displayed `₹N LPA`, internship label Stipend / CTC (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:72-75`)
- vNext now: New annualCtcInr formatted INR currency full annual amount (`src/components/placements/learner-placement-offers.tsx:73-80`)
- Fix: Show LPA conversion/units and internship-specific label where applicable.

## G2-13-005-015  [P2] GAP  facet F04  effort S
- Legacy: Legacy roleOption appended with middle dot to role title (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:67-69`)
- vNext now: New title uses roleTitle and jobTitle without roleOption suffix (`src/components/placements/learner-placement-offers.tsx:289-303`)
- Fix: Surface selected roleOption when persisted.

## G2-13-005-017  [P2] GAP  facet F04  effort S
- Legacy: Old urgent threshold respondBy.diff(now,hours) <24, highlights reply time (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:27-30`)
- vNext now: New response timing SOON uses 48-hour message (`src/components/placements/learner-placement-offers.tsx:419-431`)
- Fix: Keep 24-hour critical highlight, optionally layer 48-hour advance warning.

## G2-13-005-024  [P2] GAP  facet F06  effort S
- Legacy: Accept action button text Accept offer, Decline button text Decline (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:83-86`)
- vNext now: New Accept offer and Decline offer buttons (`src/components/placements/learner-placement-offers.tsx:434-456`)
- Fix: Match exact decline CTA label Decline if pixel wording parity is required.

## G2-13-005-036  [P2] GAP  facet F09  effort S
- Legacy: Old impact groups conditionally render only nonempty groups (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:56-60`)
- vNext now: New impact groups always show three headings and None empty counts (`src/components/placements/learner-placement-offers.tsx:595-604`)
- Fix: Hide empty groups or preserve no-elsewhere-change statement.

## G2-13-005-037  [P2] GAP  facet F09  effort S
- Legacy: Old impact preview explains The company and the placement cell are told at once (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:100-103`)
- vNext now: New modal explains current records and transaction rechecks, not exact sentence (`src/components/placements/learner-placement-offers.tsx:595-617`)
- Fix: Restore explicit company+placement-cell notification timing if true.

## G2-13-005-038  [P2] GAP  facet F09  effort S
- Legacy: Decline modal says This cannot be undone. The company and placement cell are told. (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:115-119`)
- vNext now: New description says official response cannot be undone from Learner workspace (`src/components/placements/learner-placement-offers.tsx:537-559`)
- Fix: Restore both recipient notification and irreversible warning.

## G2-13-005-040  [P2] GAP  facet F10  effort M
- Legacy: GET accept impact via previewOfferAccept(applicationId, learnerId) (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:49-54`)
- vNext now: GET `/api/placements/offers/{offerId}/accept-preview` (`src/components/placements/learner-placement-offers.tsx:128-143`)
- Fix: Map application vs offer ID request and ensure identical scoped impact groups.

## G2-13-005-048  [P2] GAP  facet F12  effort S
- Legacy: Old countsAsPlaced false displayed only when false (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:77-77`)
- vNext now: New displays false and true plus LOI/internship semantics (`src/components/placements/learner-placement-offers.tsx:348-352`)
- Fix: Align exact label and classify letters-of-intent correctly.

## G2-13-005-058  [P2] GAP  facet F16  effort M
- Legacy: Old cards use sp-offer structured flex/dl, avatar 44px (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:63-87`)
- vNext now: New rows stack at mobile and flex md, no avatar (`src/components/placements/learner-placement-offers.tsx:280-341`)
- Fix: Compare mobile 375 and desktop 1280, restore 44px identity row and fact grid.

## G2-13-005-060  [P2] GAP  facet F17  effort S
- Legacy: Old linked role and offer letter button both keyboard actionable (`docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:65-86`)
- vNext now: New role title plain, offer letter remains link and application separate (`src/components/placements/learner-placement-offers.tsx:285-358`)
- Fix: Make role heading a keyboard-focusable link to job detail.

## G2-18-011-038  [P2] GAP  facet F10  effort L
- Legacy: Legacy status mutation offer response and cascade in one service (`JobServiceImpl.java:1168-1325`).
- vNext now: New offer decision separate UI/service and normalized Offers table (`learner-placement-offers.tsx:25-59`; `placements.ts:1522-1671`).
- Fix: Build action-to-table side effect matrix including withdrawn/declined offers.

## G2-17-023-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:15-25 learner offers page within PlacementsTabsLayout
- vNext now: src/components/placements/learner-placement-offers.tsx:253-278 offers section under learner placement route
- Fix: Preserve tab position and path/deep-link to offers including pending-first view.

## G2-17-023-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:25-49 pending RELEASED cards above answered with Earlier offers heading
- vNext now: src/components/placements/learner-placement-offers.tsx:113-114,278-280 prioritized list/status-sorted items
- Fix: Match two explicit ordered legacy groups and conditional headings.

## G2-17-023-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:54-61 'How offers work at your college' panel after offer cards
- vNext now: src/components/placements/learner-placement-offers.tsx:253-270,471-495 new section mixes summary and joining outcome
- Fix: Place college policy panel after offer cards and retain exact heading.

## G2-17-023-006  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:11-14 RELEASED 'Waiting for your reply', EXPIRED 'Expired: no reply in time', WITHDRAWN 'Withdrawn by the company'
- vNext now: src/components/placements/learner-placement-offers.tsx:306-318 generic humanize(status) on ISSUED/other statuses
- Fix: Translate vNext status into original humanized text and tag tone.

## G2-17-023-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:72-78 offer facts CTC in LPA, joining date D MMM YYYY, reply by + time left
- vNext now: src/components/placements/learner-placement-offers.tsx:371-390 issued and expiresAt facts and INR display
- Fix: Restore LPA/relative time-left and original fact label order.

## G2-17-023-008  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:83-86 Accept offer primary; Decline danger; Offer letter button
- vNext now: src/components/placements/learner-placement-offers.tsx:434-457 Accept/Decline secondary styling, letter above
- Fix: Use legacy action emphasis, danger decline, and order.

## G2-17-023-011  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:73-77 CTC shown as ₹<LPA> LPA, sometimes Stipend / CTC
- vNext now: src/components/placements/learner-placement-offers.tsx:74-85,557-559 formatted annualCtcInr / empty Not specified
- Fix: Keep internship stipend label and scale INR to LPA as appropriate.

## G2-17-023-012  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:75-76 Reply by with timeLeft and Accepted/Answered actual timestamp
- vNext now: src/components/placements/learner-placement-offers.tsx:371-390 Issued and Respond by, joining outcome
- Fix: Show responded-at timestamp for answered offers, and relative urgency.

## G2-17-023-013  [P2] MISSING  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:77-77 Counts as placed No (internship) for false
- vNext now: src/components/placements/learner-placement-offers.tsx:471-495 joining outcome instead
- Fix: Surface countsAsPlaced=false on offer card to explain placement limits.

## G2-17-023-014  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:25-26 pending first and answered second grouping
- vNext now: src/components/placements/learner-placement-offers.tsx:113-114 prioritizeLearnerOffers list
- Fix: Ensure explicit latest/sort within two groups and stable tie-break.

## G2-17-023-027  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:89-113 confirm title Accept <company>'s offer?, ok Yes, accept, 3-row skeleton, retry Check again
- vNext now: src/components/placements/learner-placement-offers.tsx:568-620 same title/buttons but inline status and Retry impact preview
- Fix: Match exact modal loading/error/retry text and three-row skeleton.

## G2-17-023-028  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:56-60,99-112 impact headings Withdrawn/Other offers declined/You stay in with explanatory notes and link to college rules
- vNext now: src/components/placements/learner-placement-offers.tsx:595-610 same groups but empty 'None' and no college-rules link
- Fix: Add legacy group explanatory text and rules deep-link.

## G2-17-023-029  [P2] GAP  facet F09  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:115-119 decline title and explanation 'This cannot be undone. The company and the placement cell are told.'
- vNext now: src/components/placements/learner-placement-offers.tsx:537-567 expanded different description, option to Keep offer pending
- Fix: Use original copy under confirmation; preserve safe explicit cancel.

## G2-17-023-041  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:30-39 empty text and link applications, no offers yet
- vNext now: src/components/placements/learner-placement-offers.tsx:253-270 offer section early empty shortcut
- Fix: Restore exact empty message and application link.

## G2-17-023-047  [P2] GAP  facet F15  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:101-101 preview says company and placement cell told at once
- vNext now: src/components/placements/learner-placement-offers.tsx:614-617 confirmation text focuses transaction and joining
- Fix: Keep learner informed of immediate notifications accurately.

## G2-17-023-049  [P2] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:45-46 answered heading accessible h2 id sp-off-done
- vNext now: src/components/placements/learner-placement-offers.tsx:253-265 Offers section h2, status badges
- Fix: Use distinct pending and answered headings and anchors for screen readers.

## G2-17-023-051  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/OfferCard.jsx:11-14 legacy specific status phrases
- vNext now: src/components/placements/learner-placement-offers.tsx:306-318 generic humanize
- Fix: Restore exact Waiting for your reply and Expired: no reply in time copy.

## G2-17-023-052  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/offers.js:49-54 'Need more time on an offer...' support link
- vNext now: src/components/placements/learner-placement-offers.tsx:458-466 Request more time button on eligible offer
- Fix: Retain support link in footer and add contextual request flow.

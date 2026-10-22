# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-12-005-048  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-005-057  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-005-080  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-005-089  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-006-004  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-006-007  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-006-010  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-006-020  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-006-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)
- [ ] G2-12-006-022  (source: docs/audit/gap-fix-work/verify2/packets/lane-4/W1_lane4_4.md)

## Results

- G2-12-005-048: OK — vNext src/components/placements/learner-general-requests.tsx:75-78 and :120 offer only PLACEMENTS/HIGHER_STUDIES/NOT_INTERESTED (Entrepreneurship/Exams not selectable) matching docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:10-21
- G2-12-005-057: OK — vNext deliberately does not accept unsigned local files: src/components/placements/learner-general-requests.tsx:136-157 shows an "Offer letter" block with disabled picker (pickerUnavailable, accept .pdf/.png/.jpg/.jpeg) plus an HTTPS proof link (maxLength 2000, zod-validated at :79); the legacy R2 presign (PlacementCellContent.js:92-106,259-264) has no vNext approved learner-scoped storage API for placement requests, so a safe link-only path is used
- G2-12-005-080: OK — same deliberate safe handling at src/components/placements/learner-general-requests.tsx:143-149 (no unverified storage, helper text states the file is not attached until server-verified); legacy PlacementCellContent.js:92-106
- G2-12-005-089: OK — signed-URL-first policy is documented in-UI at src/components/placements/learner-general-requests.tsx:145-156 (proof link captured as proofUrl, "no file has been uploaded" status); legacy PlacementCellContent.js:92-106 file proof is intentionally replaced
- G2-12-006-004: OK — src/components/placements/learner-applications-browse.tsx:395-560 expands the selected application (first by default, ?applicationId= link opens it, Collapse details at :405-407) with selection process (:486), offers/links, round history and actions, matching docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:123-174
- G2-12-006-007: OK — src/components/placements/learner-applications-browse.tsx:458-475 renders cancelled-drive (with reason), staff opt-out and company-rejection banners conditionally, matching applications.js:145-154 (cancelledReason now supplied, see G2-12-006-021)
- G2-12-006-010: OK — src/app/(authenticated)/learn/my-placements/applications/page.tsx:101-125 cards show consent-safe logo (safeTpoBrandLogoUrl), role, company, job type, pay and applied date, matching applications.js:126-134
- G2-12-006-020: OK — src/components/placements/learner-applications-browse.tsx:625-630 Textarea rows=3 maxLength=900, matching applications.js:187
- G2-12-006-021: FIXED — the server-derived withdrawal grant was computed (learner-journey-service.ts withdrawalMode) but never passed to the client item, so REQUEST/SELF buttons never showed; page.tsx now passes withdraw (SELF/REQUEST/null) and cancelledReason, and LearnerPlacementJourneyItem gained those optional fields (src/app/(authenticated)/learn/my-placements/applications/page.tsx, src/components/placements/learner-placement-journey.tsx); matches applications.js:165-170
- G2-12-006-022: OK — src/components/placements/learner-applications-browse.tsx:605-610 disables submit below 3 chars only in REQUEST mode while SELF allows blank reason (schema src/modules/placements/learner-withdrawal-model.ts optional reason), matching applications.js:178-180

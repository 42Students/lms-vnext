# Lane 15 help — lane 6 verification round 2

Record of assistance by chat-15. Do **not** modify `lane-6-verify2.md`. Reviewed against legacy company curation and current vNext. No code/tests/CI executed.

## W1_lane6_21 — last unticked packet at start

- [x] **G2-9-034-091 (OK/FIXED):** Global catalogue queries canonical placement company identities, not college relationships; separate scoped CRM reader. Legacy `unverified=false` now correctly applies no verified-only filter.
- [x] **G2-9-034-111 (OK):** Paginates canonical company IDs at 50/page before relationship enrichments, separate from 10/page college relationships.
- [x] **G2-9-034-112 (FIXED):** Linked-college counts require active non-archived relationships. Global drive count, last-active and drive-count sort require matching persisted job/relation college IDs, active relationships, non-archived jobs. Added source-boundary regression tests.

## W1_lane6_20 — verified from the bottom upward (partial packet)

- [x] **G2-9-034-068 / G2-9-034-047 / G2-9-034-046 / G2-9-034-030 / G2-9-034-026 / G2-9-034-015 / G2-9-034-010 (OK):** Global catalogue pages 50 canonical company UUID rows independent of relationship multiplicity, including distinct same-name employers. Global view rejects acting-college/organization scope and tells the operator to clear it. Matching-college and active-only global statistics corrected in W1_lane6_21.
- [x] **G2-9-033-047 / G2-9-033-061 / G2-9-033-062 (OK):** College page uses 10 relationship rows and exposes contact person/email only in exact-college scope; global/organization reads project NULL for private contact fields.
- [x] **G2-9-033-077 / G2-9-033-079 (OK):** Create parser requires website or company domain and enforces HTTPS website/logo; matching form shows legacy identity and invalid-link feedback.
- [x] **G2-9-022-028 (OK):** Unexpected promotion-preview errors return fail-closed `Couldn't verify promotion` with Retry; confirmation renders only from verified ready preview.
- [x] **G2-9-014-042 (FIXED):** Bulk Assessment move now shows actual moved count with stage-specific legacy success wording, explicit skipped count for partial writes and specific failure prefix. Added dedicated unit and source-wiring tests.
- [x] **G2-17-023-046 (FIXED):** Learner offer ACCEPT and DECLINE now send a distinct, transactionally audited in-app notice to active TPO-role users in the offer’s college. No suspended or cross-college recipients; existing learner notices remain. Added regression checks.
- [x] **G2-9-010-049 / G2-9-014-061 (OK with documented safeguards):** Stage service preserves stage and screening status histories, source actor and optional in-app learner notice. Transition matrix keeps legacy forward statuses but separates exceptional corrections from ordinary moves; real offer issuance / confirmed joining are mandatory before Offered/Hired. Added policy and source-wiring tests.
- [x] **G2-9-010-068 / G2-17-023-030 (OK, state-separated):** Hired status requires confirmed joining in the stage writer; offer acceptance uses the separate audited acceptance/cascade path to handle sibling withdrawals and future bookings instead of mutating a display-only status. Direct stage movement may not forge an accepted offer.
- [x] **G2-9-036-010 (OK):** Feature Controls explicitly labels filtered college totals and module-on counts as `N of matching scoped colleges`, rather than presenting page-local numbers as unscoped platform totals.
- [ ] Other W1_lane6_20 rows require further service-level verification; this packet is NOT claimed closed and lane 6's queue remains unchanged.

Next: continue W1_lane6_20 remaining rows from bottom upward before W1_lane6_19.

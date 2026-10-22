# Lane 15 help — lane 6 verification round 2

Record of assistance by chat-15. Do **not** modify `lane-6-verify2.md`. Reviewed against legacy company curation and current vNext. No code/tests/CI executed.

## W1_lane6_21 — last unticked packet at start

- [x] **G2-9-034-091 (OK/FIXED):** Global catalogue queries canonical placement company identities, not college relationships; separate scoped CRM reader. Legacy `unverified=false` now correctly applies no verified-only filter.
- [x] **G2-9-034-111 (OK):** Paginates canonical company IDs at 50/page before relationship enrichments, separate from 10/page college relationships.
- [x] **G2-9-034-112 (FIXED):** Linked-college counts require active non-archived relationships. Global drive count, last-active and drive-count sort require matching persisted job/relation college IDs, active relationships, non-archived jobs. Added source-boundary regression tests.

Next packet: `W1_lane6_20.md` (process from its last row upward).

# Verification round 2 (REBALANCED): lane chat-1

All still-open verification-round-2 packets were redistributed evenly over the 20 lanes so no lane sits idle. This file REPLACES lane-1-verify2.md (do not edit the old file). A packet path may name another lane: that is fine, you own it now. Do your lane-1-ci10.md first if anything is unticked there. Tick [x] here as you go and push after every packet.

- [x] `docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_5.md` (25 rows)
- [x] `docs/audit/gap-fix-work/verify2/packets/lane-2/W1_lane2_7.md` (25 rows)
- [ ] `docs/audit/gap-fix-work/verify2/packets/lane-3/W1_lane3_18.md` (25 rows)
- [ ] `docs/audit/gap-fix-work/verify2/packets/lane-6/W1_lane6_4.md` (25 rows)
- [ ] `docs/audit/gap-fix-work/verify2/packets/lane-7/W1_lane7_4.md` (25 rows)
- [ ] `docs/audit/gap-fix-work/verify2/packets/lane-9/W1_lane9_6.md` (25 rows)
- [ ] `docs/audit/gap-fix-work/verify2/packets/lane-10/W1_lane10_13.md` (25 rows)
- [ ] `docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_10.md` (25 rows)
- [ ] `docs/audit/gap-fix-work/verify2/packets/lane-14/W1_lane14_16.md` (25 rows)
- [ ] `docs/audit/gap-fix-work/verify2/packets/lane-18/W1_lane18_5.md` (25 rows)

## Lane-1 packet decisions

- W1_lane2_5: G2-19-005-067 and G2-19-004-035 **FIXED** in the learner day drawer, including direct guarded attendance/reschedule and persisted request status/decision-note display. Other 23 P1 rows reviewed against the authorized current implementations: expected-vs-booked journey, audited historical funnel, placement eligibility, offer response, calendar extras, date/title/drawer, reschedule validation, saved-job scope, and signed file/link submission. Matching regression contracts were added under `tests/unit/chat1-verify2b-*`.
- Intentional vNext safety contracts: new reschedule approvals require an exact future proposed slot; historical text-only requests are displayed but not promoted into unverified bookings. Arbitrary remote URL importing is retired; signed/private file uploads and separately validated HTTPS links are the secure replacement. DB05 lesson order returns a coded 503 until the migration gate is enabled. No migration of legacy production data is claimed.

- W1_lane2_7: **triaged, not feature-complete**. OK from inspected implementation: G2-4-028-048; DEFERRED (not verified, no parity claim): G2-4-026-080, G2-4-010-068, G2-4-022-002, G2-4-022-065, G2-12-025-002, G2-12-025-009, G2-12-025-026, G2-13-031-079, G2-13-031-080, G2-13-031-081, G2-13-031-082, G2-13-031-084, G2-13-031-086, G2-13-031-099, G2-13-031-102, G2-13-031-104, G2-5-002-060, G2-5-006-036, G2-5-008-045, G2-5-010-017, G2-5-012-059, G2-5-012-096, G2-5-022-004, G2-5-022-006. Remaining items require per-file implementation and/or migration review; no code fix is claimed in this pass.

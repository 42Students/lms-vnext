# Work packet: NEW / MISSING items from docs/audit/gap2/lane-13/l17-u023-learneroffer.md (part 2 of 2)

7 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-13/l17-u023-learneroffer.md

## G2-17-23-079  [P1] GAP  facet F20 Duplicate action  effort M
- Legacy: TS:174–176 rejects any repeated attempt after first decision; LC:44–46 returns 409
- vNext now: VS:718–728/929–932 has service-level no-op replay, BUT VA:36 passes expectedStatus ISSUED and VS:700–703 rejects final status first
- Fix: Resolve contradictory idempotency contract: either allow exact same-actor retry before expectedStatus rejection or intentionally return 409; cover deadline crossover

## G2-17-23-080  [P1] GAP  facet F20 Two-tab race  effort L
- Legacy: JS:1169–1174 locks learner for accept; JS:1332–1359 stable sibling lock ordering; JO:116–118 optimistic version
- vNext now: VS:665–688 locks membership/offer, VS:816–833 locks siblings; VDB:1531 version integer
- Fix: Verify no deadlocks for simultaneous accept/decline/withdraw/interview updates and no dual accepted outcomes; preserve deterministic lock order

## G2-17-23-081  [P1] GAP  facet F20 Timezone  effort M
- Legacy: TS:177–183 uses LocalDateTime.now with server default and JO:63–64 stores timezone-less; JS:1224 explicitly UTC for application status
- vNext now: VDB:1561–1563,1579–1581 timestamptz, VPOL:39–69 uses India-time Sunday rule
- Fix: Define one authoritative Asia/Kolkata business deadline converted to UTC instant; guard at lock time and format IST correctly

## G2-17-23-083  [P1] GAP  facet F21 Background delivery  effort M
- Legacy: TS:188–195 publishes bell and audit; JS:1238–1241 status-changed event, JS:1107–1124 afterCommit
- vNext now: VS:893–925/982–1010 event+notification within transaction; SJ:72–73 schedules expiry
- Fix: Reconcile durable event/outbox delivery semantics and post-commit notification guarantees; add audit event correlation IDs

## G2-17-23-085  [P1] GAP  facet F22 Legacy table  effort M
- Legacy: JO:24–35 MySQL job_offer with BIGINT auto-id and application_id integer, JO:116–118 optimistic version
- vNext now: VDB:1522–1531 PostgreSQL placement_offers UUID key and UUID application FK, int version
- Fix: Maintain legacy id/type crosswalk in DB08 migration for records, reports and external links; do not cast numeric IDs to UUID

## G2-17-23-086  [P1] GAP  facet F22 Status constraints  effort M
- Legacy: JO:69–75 string enum comment RELEASED/ACCEPTED/DECLINED plus other states, status column NOT NULL
- vNext now: VDB:1615–1620 CHECK status in ISSUED/ACCEPTED/DECLINED/WITHDRAWN/EXPIRED and kind LOI/OFFER, D85:18–31
- Fix: Map SELECTED/PENDING_VERIFICATION/RELEASED and REVOKED separately to vNext issuance/withdrawal; validate archival cases before importing

## G2-17-23-088  [P1] GAP  facet F22 Audit tables  effort M
- Legacy: JS:1238–1241 emits application status history events; TS:188–195 audit log/bell
- vNext now: VDB:1672–1721 append-only offer status history with actor/reason/cascade and unique active-application constraints VDB:1597–1609
- Fix: Ensure report timeline can relate offer, application, actor, status, cascade and notification from both models

# U014 — TPO JobOfferRepository

Audit only, current main 2026-10-21, no code changes/CI.

## Closure

Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobOfferRepository.java:1-32`, `model/tpo/JobOffer.java:1-120`, JobApplication entity, offer controller/services and MySQL job_offer migration. vNext `src/modules/placements/offer-service.ts`, `tpo-offer-lifecycle-service.ts:1-260`, `tpo-drive-offer-register-service.ts:1-36`, `held-offer-facts-service.ts`; `src/app/api/placements/tpo/offers/expiry/route.ts:1-43`; `src/db/schema/placements.ts:1522-1670`, DB09 migration. Citations in rows resolve basename to these paths; 1-based lines. The old exact cron dispatcher and migration indices need targeted live/source verification (UNKNOWN) beyond repository-only evidence.

## 23 mandatory facets

| ID | Facet | Legacy (file:line) | vNext (file:line) | Verdict | Severity | Concrete fix | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G2-16-014-001 | F01 | JobOfferRepository.java:12-16 Spring JPA repository not screen. | offer-service.ts:71-145 typed Drizzle service. | MATCH | P3 | No direct UI in repository. | S |
| G2-16-014-002 | F01 | JobOfferRepository.java:14-16 by application and latest. | offer-service.ts:112-145 lookup single offer UUID. | GAP | P2 | Restore per-application latest/history selector. | M |
| G2-16-014-003 | F02 | JobOfferRepository.java:18-23 by job and learner cross join. | tpo-drive-offer-register-service.ts:18-25 job-scoped register. | GAP | P2 | Expose both job and learner scoped read projections. | M |
| G2-16-014-004 | F02 | JobOfferRepository.java:25-31 due-expiry and dispute query outputs. | tpo-offer-lifecycle-service.ts:136-140 interactive expiry check only. | MISSING | P1 | Implement actual due batch readers and transitions. | L |
| G2-16-014-005 | F03 | JobOfferRepository.java:12-32 API repository no interactive buttons. | tpo-drive-offer-register-service.ts:12-36 backend read only. | MATCH | P3 | No control required here. | S |
| G2-16-014-006 | F04 | JobOfferRepository.java:14 find all offers by application. | offer-service.ts:394-409 active offer read. | GAP | P2 | Allow historical versions in read. | S |
| G2-16-014-007 | F04 | JobOfferRepository.java:16 latest createdAt DESC. | offer-service.ts:495-507 max version during issuance. | GAP | P2 | Sort per-app latest issuedAt DESC with stable tie-break. | S |
| G2-16-014-008 | F05 | JobOfferRepository.java:25-26 RELEASED and respondBy < current timestamp. | placements.ts:1533-1563 ISSUED and expiresAt. | GAP | P1 | Map statuses and run scheduled expiry strict cutoff. | L |
| G2-16-014-009 | F05 | JobOfferRepository.java:29-31 accepted EXTERNAL_IMPORT, disputable until before now. | placements.ts:1552-1555 fields retained; lifecycle-service.ts:117-140 lacks maturity check. | MISSING | P1 | Create external-dispute maturation query and approved cascade. | L |
| G2-16-014-010 | F05 | JobOfferRepository.java:21-23 learner offers across applications used for held CTC. | offer-service.ts:480-493 loadPlacementHeldOfferFacts. | GAP | P2 | Compare learner/college scope and held-status CTC calculation. | M |
| G2-16-014-011 | F06 | JobOfferRepository.java:14-16 integer application/offer IDs. | placements.ts:1525-1532 UUID IDs. | GAP | P2 | Document old-ID compatibility if migration needed. | L |
| G2-16-014-012 | F06 | JobOfferRepository.java:29-31 excludes null dispute deadline. | placements.ts:1553-1555 nullable deadline. | MATCH | P3 | Use IS NOT NULL in future due query. | S |
| G2-16-014-013 | F07 | JobOfferRepository.java:25-31 empty due set returns empty List. | tpo-offer-lifecycle-service.ts:79-104 requires valid batch input. | GAP | P2 | Background scan no-op should not throw user form error. | S |
| G2-16-014-014 | F07 | JobOfferRepository.java:16 Optional.empty if none. | offer-service.ts:139-142 throws offer not found for required ID. | GAP | P3 | Provide optional latest-by-application. | S |
| G2-16-014-015 | F08 | JobOfferRepository.java:12-32 no client toast. | tpo-drive-offer-register-service.ts:12-36 no toast. | MATCH | P3 | None in repository scope. | S |
| G2-16-014-016 | F09 | JobOfferRepository.java:12-32 no modal or drawer. | tpo-offer-lifecycle-service.ts:1-260 server-only. | MATCH | P3 | Overlays belong TPO UI. | S |
| G2-16-014-017 | F10 | JobOfferRepository.java:14-23 read by application, latest, job and learner. | offer-service.ts:71-145; tpo-drive-offer-register-service.ts:19-25 support subset. | GAP | P2 | Add full typed scoped read methods. | M |
| G2-16-014-018 | F10 | JobOfferRepository.java:25-26 expiry queue. | src/app/api/placements/tpo/offers/expiry/route.ts:9-36 exports watchlist CSV only. | MISSING | P1 | Build idempotent expiry transition job, not only CSV. | L |
| G2-16-014-019 | F10 | JobOfferRepository.java:29-31 external acceptance dispute queue. | tpo-offer-lifecycle-service.ts:117-140 manual acceptance logic. | MISSING | P1 | Schedule post-dispute cascade release. | L |
| G2-16-014-020 | F11 | JobOfferRepository.java:18-23 raw JPA by job/learner without explicit auth. | tpo-drive-offer-register-service.ts:13-22 active TPO/college scoped. | EXTRA | P3 | Keep stronger access checks. | S |
| G2-16-014-021 | F11 | JobOfferRepository.java:25-31 system-wide scheduled due scan. | tpo-offer-lifecycle-service.ts:41-60 requires active TPO. | GAP | P1 | Give system scheduler isolated job identity and tenant-scoped transactions. | L |
| G2-16-014-022 | F12 | JobOfferRepository.java:25-26 RELEASED vs SELECTED/PENDING_VERIFICATION status excluded. | placements.ts:1615-1617 only ISSUED/ACCEPTED/DECLINED/WITHDRAWN/EXPIRED. | GAP | P1 | Preserve verification stage as separate lifecycle before issued. | L |
| G2-16-014-023 | F12 | JobOfferRepository.java:29-31 external acceptance waits 48h when acceptedDisputableUntil set. | placements.ts:1552-1555 retains timestamp; no clear background consumer. | GAP | P1 | Do not trigger accepted-offer cascade before dispute window ends. | M |
| G2-16-014-024 | F13 | JobOfferRepository.java:25-31 due scans validly return zero records. | tpo-offer-lifecycle-service.ts:63-103 requires selected offer ids. | GAP | P2 | Use system sweep no-op result. | S |
| G2-16-014-025 | F14 | JobOfferRepository.java:12-32 no upload/export in repository. | tpo-drive-offer-register-service.ts:28-34 read-only CSV separate. | EXTRA | P3 | Keep export nonmutating. | S |
| G2-16-014-026 | F15 | JobOfferRepository.java:25-31 read-only selectors, no direct mail. | tpo-offer-lifecycle-service.ts:219-254 manual updates emit learner event. | GAP | P2 | Notify learner once on system expiry and maturation where appropriate. | M |
| G2-16-014-027 | F15 | JobOfferRepository.java:14-23 pure reads. | tpo-drive-offer-register-service.ts:28-34 read-only CSV no send. | MATCH | P3 | Keep read side-effect-free. | S |
| G2-16-014-028 | F16 | JobOfferRepository.java:12-32 backend-only, no viewport layout. | tpo-drive-offer-register-service.ts:12-36 backend-only. | MATCH | P3 | UI separately audited. | S |
| G2-16-014-029 | F17 | JobOfferRepository.java:12-32 backend-only, no keyboard control. | offer-service.ts:1-1788 backend-only. | MATCH | P3 | UI accessibility outside this repository. | S |
| G2-16-014-030 | F18 | JobOfferRepository.java:25-26 string RELEASED. | placements.ts:1615-1617 ISSUED. | GAP | P2 | Map enums intentionally and label accurately. | S |
| G2-16-014-031 | F18 | JobOfferRepository.java:29-31 string EXTERNAL_IMPORT. | placements.ts:1634-1637 same enum allowed. | MATCH | P3 | Preserve exact value. | S |
| G2-16-014-032 | F19 | JobOfferRepository.java:18-23 joins by app jobId and learnerId. | placements.ts:1607-1609 offer app+status index. | GAP | P2 | Verify application job/learner join indexes. | M |
| G2-16-014-033 | F19 | JobOfferRepository.java:25-31 time-window due scans. | placements.ts:1607-1609 no status/time composite indexes. | GAP | P2 | Add partial status/expiry and dispute-deadline indexes. | M |
| G2-16-014-034 | F20 | JobOfferRepository.java:25-31 scans without explicit SELECT FOR UPDATE. | offer-service.ts:310-380 uses transactional offer issuance row locks. | EXTRA | P3 | Use SKIP LOCKED or CAS in new due sweeper. | L |
| G2-16-014-035 | F20 | JobOfferRepository.java:29-31 strict date < current. | placements.ts:1553-1555 timestamptz, no due scan. | GAP | P2 | Implement strict DB-clock cutoff with idempotent cascade. | M |
| G2-16-014-036 | F21 | JobOfferRepository.java:3-6 Spring JPA. | offer-service.ts:3-13 Drizzle/PG. | EXTRA | P3 | No JPA parity need, preserve results. | S |
| G2-16-014-037 | F22 | JobOfferRepository.java:13 JpaRepository Long PK and Integer application FK. | placements.ts:1522-1532 UUID keys and app-level version. | GAP | P2 | Record historical mapping or approved no-migration choice. | L |
| G2-16-014-038 | F22 | JobOffer.java:38-118 CTC LPA, joining/status, version/time fields. | placements.ts:1532-1595 INR integer, pay breakdown and audit actor columns. | GAP | P2 | Verify CTC conversion, null joins, lifecycle timelines. | L |
| G2-16-014-039 | F22 | JobOfferRepository.java:25-31 two due predicates need indexed columns. | placements.ts:1533-1555 has statuses and deadline fields. | GAP | P2 | Add partial due indexes and test query plan. | M |
| G2-16-014-040 | F23 | JobOfferRepository.java:25-31 both scheduled selectors needed. | tpo-offer-lifecycle-service.ts:36-260 has only manual actions, expiry CSV is read-only. | MISSING | P1 | Implement expiry/maturation jobs. | L |
| G2-16-014-041 | F23 | JobOfferRepository.java:18-23 two aggregate scopes. | tpo-drive-offer-register-service.ts:23-25 job and offer-service.ts:480-493 learner facts. | GAP | P2 | Reconcile scopes, eligible statuses and CTC held rules. | M |

## Summary

41 rows, F01–F23 complete. Severity P3 14; P2 18; P1 9. Highest risk: expiry and external-import acceptance maturity are not equivalent to the read-only CSV watchlist; status enum RELEASED/ISSUED mapping and 48h dispute constraint; missing partial indexes. UNKNOWN: exact legacy expiry cron, 48h dispute notices, old SQL DDL and CTC migration. Do not infer runtime readiness from schema alone.

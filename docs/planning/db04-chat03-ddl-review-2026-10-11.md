# DB-007 / Chat 3 — DB04 source-to-staged-schema adversarial review

**Review date:** 2026-10-11 IST  
**Worker:** Chat 3 / [issue #23](https://github.com/42Students/lms-vnext/issues/23)  
**Global phase:** DATABASE (ACTIVE); API/UI/RELEASE remain LOCKED.  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Canonical source ledger:** `docs/planning/db-pass4-columns-db04_profiles_and_verification.json`  
**Proposed field mappings:** `docs/planning/db04-field-crosswalk-proposals.json`  
**Staged schema:** `src/db/schema/profile-verification.ts`  
**SQL draft, *not registered*:** `docs/planning/db04-proposed-migration.sql`

## Evidence completed in this batch

Compared legacy `V187__profile_verification.sql` DDL against the staged vNext Drizzle schema and verification implementation. Also reviewed `V161__tpo_v1_drives.sql`, `V165__tpo_v1_complete.sql`, and `V192__academic_marks_as_earned.sql` against `placement_candidate_academic_evidence`, staged academic marks, and the academic publication service. The 15 current verification, 10 event-history, and 18 academic evidence fields now carry individual source-review evidence and open probes in the field-proposals JSON. This is not a review of every current legacy writer/reader.

| Metric | Current evidence | Interpretation |
| --- | ---: | --- |
| Legacy DB04 source candidate tables | 7 | Historical candidate tables, not necessarily 7 active tables |
| Legacy DB04 candidate fields | 103 | Exhaustiveness beyond the frozen inventory not proved |
| DDL-to-staged schema source-reviewed in this batch | 43 | 15 verification + 10 history + 18 academic; **not** workflow verified |
| Other DB04 fields not covered by this batch | 60 | Qualifications, registration, image and approver card need current source usage and disposition |
| Formally DB/semantic verified fields | **0** | No disposable PostgreSQL verification executed |
| Registered and replayed DB04 migration | **No** | Staged schema and SQL are not runtime contract |
| Approved field/table retirements | **0** | No unsupported retirement inferred |

### Observations requiring closure (not assertions of executed failures)

**DB04-C3-01 — Reviewer identity provenance (high).** Legacy `profile_verification` has both `decided_by_name` and `verified_by_name`, as well as `decided_by_type` (`ADMIN | SUPER_ADMIN | TPO`). The staged current-row vNext table has `decided_by_name` and `decided_by_user_id`, but not a separate `verified_by_name`. Its event history could correctly derive the last approval, including after a denied `UPDATE_PENDING` request, but that *consumer query and immutable historical provenance need proof*. Verify legacy ADMIN→COLLEGE_ADMIN mapping explicitly; a direct string match is wrong.

**DB04-C3-02 — JSONB and snapshot privacy (critical).** Legacy V187 explicitly says identity snapshots are masked. The vNext state planner applies an application-level masking/reference guard, but staged `submitted_snapshot`, `verified_snapshot`, and event `snapshot` fields are JSONB without a database-level redaction shape constraint. A direct SQL insert could include raw identity data unless DB role privileges/protected write paths prevent it. Design a defensible DB permission/redaction witness; never use actual personal identifiers in tests.

**DB04-C3-03 — Private receipt DDL is looser than its validator (high).** `profile_private_document_receipts.private_object_key` only prohibits `://` in its staged SQL CHECK, whereas `verifyGcsPrivateDocumentReceipt` requires a `private/` prefix and safe character set. `sha256_hex` only checks length at SQL level while the validator requires hex characters; `object_generation` has no numeric SQL CHECK. `related_entry_id` is a nullable unconstrained UUID without a proven same-owner education-entry reference. Client/service validation is valuable but cannot stand in for the intended **database** integrity witness. Stage a matching constraint change only after checking producer compatibility and avoiding concurrent `src/db/schema/**` edits.

**DB04-C3-04 — SQL-only direct-write audit guarantees (high).** The *unregistered SQL draft* has an event UPDATE/DELETE rejection trigger and current-row revision increment trigger. It does not appear to impose a deferred database-level current-row-event pairing requirement, so SQL-only mutation of a verification status without corresponding review event must be investigated. App transaction writer correctly intends to write both atomically, but an application guarantee is not a database-only proof.

**DB04-C3-05 — Educational marks provenance (high).** `profile_verification_academic_marks` has a composite FK to parent verification id and membership, which is good, but it does not itself require the referenced verification's section to be EDUCATION or that an effective verified snapshot exists. The current writer publishes marks on approval only; direct-SQL negative probes and source-version consistency checks remain required. For a pending learner update, last approved evidence must remain effective. CGPA rule changes may legitimately recompute comparable percentages without changing the approved raw mark.

**DB04-C3-06 — Historical academic evidence defaults and provenance (high).** V161 defines nullable `gap_years` with default 0, while vNext `placement_candidate_academic_evidence.gap_years` is nullable with no column default. Validate whether source absence, implicit zero, and explicit zero affect placement filters. The legacy academic record also contains `source = SELF | VERIFIED`, upload/import provenance, a batch label added by V165, and original mark JSON added by V192. Source review alone does not establish safe retirement of import provenance or equivalence of cohort-derived batch filters. Verify live producer and consumer semantics before disposition.

**DB04-C3-07 — State/actor and tenant negative tests (critical phase gate).** V187 events use an integer actor id/type; vNext uses canonical user UUID and actor kinds. Verify source actor identity semantics, current active membership and reviewer entitlements, same-college TPO grant and settings checks, SUPER_ADMIN scope, stale reviewer races, event retention and direct-SQL wrong-tenant writes. Tests authored or sketched are **not PASSED** until executed on a migrated disposable PostgreSQL database.

## Next witness and integration queue

1. Continue the remaining 60 source fields: `qualification` (24), `student_registration` (22), `student_image` (3), `approver_id_card` (11). Confirm current producers/consumers before deciding active vs retired; avoid duplicating DB01/DB02/DB08 work. Also finish producer/consumer reviews and SQL proof for the 43 source-reviewed proposals.
2. With the DB03 owner, avoid concurrent edits of `src/db/schema/**`. Chat 1 exclusively integrates `drizzle/**`, schema barrel and CI. Hand off DB04 staged constraints/SQL and confirm actual replay.
3. Execute negative SQL witnesses for bogus private object keys/digests, forged tenant/role, UPDATE/DELETE event, current-row update without event, mismatched mark section/owner and duplicate submissions/reviews.
4. Execute snapshot privacy/grade formula and storage-backed receipt lifecycle tests. Leave GCP/malware scanner and PostgreSQL witness outcomes BLOCKED if infrastructure is unavailable.
5. Update the field ledger with **executed** exact test source+commit SHA only; do not count these 43 source comparisons as DB_TESTED or VERIFIED.

**Current disposition:** DB-007 remains `IN_PROGRESS`. No DB04 field is certified, no phase promotion, no source-runtime code or migration journal edited during this batch.

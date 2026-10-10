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
| DDL-to-staged schema source-reviewed | 43 | 15 verification + 10 history + 18 academic; **not** workflow verified |
| Repository source/disposition reviewed | **103 / 103** | All frozen candidates now have source evidence; the later 60 are disposition-reviewed, not DDL/runtime certified |
| Remaining-batch current named producer/consumer confirmed | 27 | `qualification` 24 + `student_image` 3 |
| Remaining-batch unresolved retirement candidates | 33 | `student_registration` 22 + `approver_id_card` 11; **not approved retirements** |
| Formally DB/semantic verified fields | **0** | No disposable PostgreSQL verification executed |
| Registered and replayed DB04 migration | **No** | Staged schema and SQL are not runtime contract |
| Approved field/table retirements | **0** | No unsupported retirement inferred |


## Remaining 60-field source/disposition pass

The exact legacy oracles are still unchanged: backend `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`, frontend `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`. The remaining 60 frozen candidates were inspected against those source trees and the current vNext profile contract. This completes a **source/disposition review**, not semantic or PostgreSQL verification.

### Qualification — 24 fields: ACTIVE source contract, incomplete vNext semantics

`Qualification.java`, `QualificationRepository.java`, `LearnerProfileServiceImpl.java`, the learner education controller, frontend `profile/about/qualifications.js`, and `ScreeningServiceImpl.java` prove that the qualification table remains an active product contract. Current profile CRUD reads/writes the structured education fields, uses soft delete, validates learner-owned marksheet references, and the production screening service consumes program, specialization, grading type/grade and graduation year. In particular, screening explicitly accepts both **CGPA and GPA**.

Current vNext nests education in `learner_profiles.profile_document.education[]`. That normalization is valid in principle, but the strict schema currently loses or changes several active semantics:

- `grading_type`: vNext accepts `CGPA | Percentage | Grade`, while production screening explicitly consumes **GPA** too.
- `is_currently_pursuing`: vNext has no explicit persisted flag; treating a blank `endYear` as equivalent is not proven.
- `certificate_upload`: production exposes learner marksheet attachment. The staged private-receipt table can represent a secure object receipt, but there is no enforced education-item-to-receipt linkage yet.
- `is_recent_education`: production persists/sorts the flag and qualification validation expects a single primary qualification in qualification sets; vNext has no persisted counterpart.
- `exam_rank`: no explicit vNext field; whether `examDetails` fully supersedes it is not proven.
- legacy `degree/field/score/description` are still read/written by the backend compatibility DTO. Because vNext is greenfield they may ultimately be retired, but that is a compatibility decision rather than a silent omission.
- per-item create/update/tombstone history is not represented by the aggregate JSON timestamps. Whether that is acceptable needs an audit/history decision.

### Student image — 3 fields: ACTIVE source contract, missing persisted vNext collection

`StudentImageServiceImpl` still creates rows, serializes `image_data` as `[{imageId,imageUrl,active}]`, fetches by learner, and deactivates individual image IDs. `StudentImageController` exposes authenticated create/get/deactivate endpoints and checks learner access plus the learner-owned storage folder.

No equivalent persisted image collection was found in the current vNext learner profile contract. `profile_private_document_receipts` has a `PROFILE_IMAGE` purpose, which can prove an uploaded object, but a receipt alone does not encode the legacy collection identity/active-state behavior. DB04 therefore needs either a normalized learner-image relation or an explicitly designed profile-document image collection referencing secure receipts.

### student_registration — 22 fields: unresolved retirement candidate, not placement registration

The exact production backend tree has no named `StudentRegistration` model/controller/service/repository and no CRM-named source path. Current learner placement registration is a **different** model/table, `PlacementRegistration -> placement_registration`, and `BatchRegistrationService` works through learner/class/batch/placement tables.

That is strong evidence against blindly recreating `student_registration`, but it does **not** prove absence of native SQL, detached integrations or external CRM consumers. All 22 fields are therefore marked `UNRESOLVED_RETIREMENT_CANDIDATE`, not retired. DB01/DB02 must either prove the external roster/import path is dead or design a separate external-registration/import contract; it must not be mapped to DB08 `placement_registration` by name.

### approver_id_card — 11 fields: unresolved retirement candidate

The exact production backend tree has no named approver/assigned-exam model, repository, service or controller path. Named exam code that remains is learner profile qualifying-exam configuration, not an assigned-exam reviewer-card subsystem. This makes `approver_id_card` a strong retirement candidate, but native-SQL or detached consumer absence is still unproved. No vNext table should be added merely to preserve the historical name until that proof or explicit product approval exists.


### Observations requiring closure (not assertions of executed failures)

**DB04-C3-01 — Reviewer identity provenance (high).** Legacy `profile_verification` has both `decided_by_name` and `verified_by_name`, as well as `decided_by_type` (`ADMIN | SUPER_ADMIN | TPO`). The staged current-row vNext table has `decided_by_name` and `decided_by_user_id`, but not a separate `verified_by_name`. Its event history could correctly derive the last approval, including after a denied `UPDATE_PENDING` request, but that *consumer query and immutable historical provenance need proof*. Verify legacy ADMIN→COLLEGE_ADMIN mapping explicitly; a direct string match is wrong.

**DB04-C3-02 — JSONB and snapshot privacy (critical).** Legacy V187 explicitly says identity snapshots are masked. The vNext state planner applies an application-level masking/reference guard, but staged `submitted_snapshot`, `verified_snapshot`, and event `snapshot` fields are JSONB without a database-level redaction shape constraint. A direct SQL insert could include raw identity data unless DB role privileges/protected write paths prevent it. Design a defensible DB permission/redaction witness; never use actual personal identifiers in tests.

**DB04-C3-03 — Private receipt DDL is looser than its validator (high).** `profile_private_document_receipts.private_object_key` only prohibits `://` in its staged SQL CHECK, whereas `verifyGcsPrivateDocumentReceipt` requires a `private/` prefix and safe character set. `sha256_hex` only checks length at SQL level while the validator requires hex characters; `object_generation` has no numeric SQL CHECK. `related_entry_id` is a nullable unconstrained UUID without a proven same-owner education-entry reference. Client/service validation is valuable but cannot stand in for the intended **database** integrity witness. Stage a matching constraint change only after checking producer compatibility and avoiding concurrent `src/db/schema/**` edits.

**DB04-C3-04 — SQL-only direct-write audit guarantees (high).** The *unregistered SQL draft* has an event UPDATE/DELETE rejection trigger and current-row revision increment trigger. It does not appear to impose a deferred database-level current-row-event pairing requirement, so SQL-only mutation of a verification status without corresponding review event must be investigated. App transaction writer correctly intends to write both atomically, but an application guarantee is not a database-only proof.

**DB04-C3-05 — Educational marks provenance (high).** `profile_verification_academic_marks` has a composite FK to parent verification id and membership, which is good, but it does not itself require the referenced verification's section to be EDUCATION or that an effective verified snapshot exists. The current writer publishes marks on approval only; direct-SQL negative probes and source-version consistency checks remain required. For a pending learner update, last approved evidence must remain effective. CGPA rule changes may legitimately recompute comparable percentages without changing the approved raw mark.

**DB04-C3-06 — Historical academic evidence defaults and provenance (high).** V161 defines nullable `gap_years` with default 0, while vNext `placement_candidate_academic_evidence.gap_years` is nullable with no column default. Validate whether source absence, implicit zero, and explicit zero affect placement filters. The legacy academic record also contains `source = SELF | VERIFIED`, upload/import provenance, a batch label added by V165, and original mark JSON added by V192. Source review alone does not establish safe retirement of import provenance or equivalence of cohort-derived batch filters. Verify live producer and consumer semantics before disposition.

**DB04-C3-07 — State/actor and tenant negative tests (critical phase gate).** V187 events use an integer actor id/type; vNext uses canonical user UUID and actor kinds. Verify source actor identity semantics, current active membership and reviewer entitlements, same-college TPO grant and settings checks, SUPER_ADMIN scope, stale reviewer races, event retention and direct-SQL wrong-tenant writes. Tests authored or sketched are **not PASSED** until executed on a migrated disposable PostgreSQL database.

## Next witness and integration queue

1. Source/disposition review is now 103/103. Close the concrete qualification/image gaps, obtain DB01/DB02 disposition for `student_registration`, and prove native-SQL/external-consumer absence or explicit retirement approval for `approver_id_card`. Also finish semantic producer/consumer equivalence and SQL proof for all active mappings.
2. With the DB03 owner, avoid concurrent edits of `src/db/schema/**`. Chat 1 exclusively integrates `drizzle/**`, schema barrel and CI. Hand off DB04 staged constraints/SQL and confirm actual replay.
3. Execute negative SQL witnesses for bogus private object keys/digests, forged tenant/role, UPDATE/DELETE event, current-row update without event, mismatched mark section/owner and duplicate submissions/reviews.
4. Execute snapshot privacy/grade formula and storage-backed receipt lifecycle tests. Leave GCP/malware scanner and PostgreSQL witness outcomes BLOCKED if infrastructure is unavailable.
5. Update the field ledger with **executed** exact test source+commit SHA only; do not count any of the 103 source-review entries as DB_TESTED or VERIFIED.

**Current disposition:** DB-007 remains `IN_PROGRESS`. The frozen 103/103 candidate fields now have source/disposition review evidence, but **0 are semantic/runtime certified** and **0 retirements are approved**. No phase promotion. This pass changed documentation only; it did not edit shared schema/migration files or claim PostgreSQL evidence.

## 2026-10-11 Chat 3 continuation — remaining 60-field source-review outcome

**All 103 field candidates now carry `sourceReview` evidence in both** the canonical `db-pass4-columns-db04_profiles_and_verification.json` and `db04-field-crosswalk-proposals.json`. The canonical `reviewStatus` remains `UNVERIFIED_FIELD_SEMANTICS` for all 103, and no retirements or runtime verification are credited.

| Legacy table | Fields | Current source evidence | Open semantic status |
| --- | ---: | --- | --- |
| `qualification` | 24 | Active `Qualification.java`, `BaseModel.java`, `LearnerProfileServiceImpl.java`, `QualificationRepository.java`, `EducationDTO.java` | Active and required; several fields lost in vNext strict education JSON |
| `student_image` | 3 | Active `StudentImage.java`, `StudentImageServiceImpl.java`, `StudentImageController.java` | Active gallery and per-image deactivate behavior lacks a demonstrated target |
| `student_registration` | 22 | Historical schema snapshot; no exact-name Java entity found in inspected model tree | **Unknown active/retired**; require current producer/consumer and source audit, especially pre-enrollment/external sync |
| `approver_id_card` | 11 | Historical schema snapshot, `assigned_exam_id` relationship | **Unknown active/retired**; require assessment/exam system audit; never classify private objects as learner identity without evidence |

### Concrete vNext gaps: active qualification model

Legacy `EducationDTO` and `LearnerProfileServiceImpl.qualificationToDTO/dtoToQualification` carry distinct fields `degree`, `field`, `score`, `description`, `examRank`, `isCurrentlyPursuing`, `isRecentEducation`, and `certificateUpload`. VNext `src/modules/people/profile-validation.ts` has a **strict** `educationSchema` without these keys, meaning an exact as-is payload cannot round-trip. In addition:

- Legacy `Qualification extends BaseModel` tracks *per qualification* `created_at`, `updated_at`, `is_deleted`; vNext `learner_profiles.profile_document.education[]` only has a profile-level timestamp and deletes entries through array replacement. This is not a verified semantic equivalent.
- Legacy education sorting prioritizes `isRecentEducation`; vNext lacks the flag.
- Legacy `EducationDTO` accepts GPA as a grading category; current vNext enum only includes CGPA, Percentage and Grade. Legacy `examDetails` is `Map<String,Object>`, whereas vNext limits each value to a primitive. Both require compatibility decisions.
- Legacy marksheet `certificateUpload` is active source data. A staged `MARKSHEET` receipt is safer than persistent public URLs but must be linked to the owning qualification and proven in a real upload/read lifecycle.

### Concrete vNext gaps: active student image workflow

The legacy image controller supports create/get/deactivate under `/api/v1/learner-images`; `image_data` serializes a list of `imageId`, `imageUrl`, and integer `active`. A profile image storage receipt does **not** by itself implement stable gallery entries and deactivation. The new [education+media candidate SQL](sql/db04-education-media-candidate.sql) stages separate education-entry/media tables, `row_version`, soft-deletion and same-owner receipt FKs. This is a proposal, not an integrated migration. The separate [receipt-hardening candidate SQL](sql/db04-private-receipt-hardening-candidate.sql) stages exact object-key, hash and generation-format checks matching the server verifier. None has been executed.

### Updated privacy observation

The current `upsertOwnLearnerProfileDocument` and `drizzleProfileRepository.upsertLearnerProfileDocument` **explicitly reject** raw Aadhaar/PAN values while private storage is unavailable. This is a fail-closed behavior, not evidence of an exposed production write route. However, staged generic JSONB columns still need SQL-level privilege/redaction evidence, and an actual private vault/receipt flow remains BLOCKED for usable identity submission. Do not infer a vulnerability exploit or a passing safety gate from source inspection alone.

**Handoff to migration/CI integrator:** Chat 1 reviews `docs/planning/sql/db04-education-media-candidate.sql` and `docs/planning/sql/db04-private-receipt-hardening-candidate.sql`, reconciles them with the schema barrel/journal, and owns disposable PostgreSQL replay. Chat 3 retains DB-007 IN_PROGRESS until source usage, integration/witness outcomes and signoff are available. API/UI waves remain locked.

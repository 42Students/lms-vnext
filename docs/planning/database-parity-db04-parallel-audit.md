# DB04 parallel workstream — source-backed profile and verification audit
**Date:** 2026-10-10  
**Owner:** independent DB04 chat — see [coordination issue #2](https://github.com/42Students/lms-vnext/issues/2)  
**Working branch:** `db04-profile-verification-2026`, forked from `db-parity-2026@c489b2569dd2d2742da2ee17ed313a26853dc4da`  
**Legacy BE oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy FE oracle observed:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Status:** **SOURCE AUDIT + IMPLEMENTATION CONTRACT — NOT SCHEMA-VERIFIED**. No DB04 schema, migration, service or test has been executed by this workstream.

## 1. Parallel ownership / conflict control
- **This branch only:** DB04 profiles, identity/education verification, private-file ownership, verified academic evidence/grade provenance. No edits to shared DB03 code, Drizzle 0037, shared journal, or the canonical tracker while another chat is actively changing them.
- **Other chat:** DB03 group/elective service and source field mapping, group-backed content/quiz/attendance/grading consumers, PostgreSQL replay and tests.
- **Future DB08 owner:** placement batch and eligibility event/undo flows; DB04 may specify academic evidence boundary but must not rewrite DB08 business policy.
- Rebase/review shared head before promoting code. Migration numbers and Drizzle snapshot must be allocated only after the DB03 branch is stable. No force-push.

## 2. Evidence and completeness
Exact checked sources:
1. Legacy `src/main/resources/db/migration/V187__profile_verification.sql` (two verification tables, review statuses, event actions, `tpo_can_verify_profiles` default ON).
2. Legacy `src/main/resources/db/migration/V192__academic_marks_as_earned.sql` (original grade/scale/max JSON and configurable college CGPA conversion).
3. Legacy `docs/tpo-ux/PROFILE-VERIFICATION-DESIGN.md`, `ACTIONS-AUDIT-6-VERIFICATION-2026-10-05.md`, `TPO-PROFILE-NOTES-2026-10-04.md` (completeness, reviewer rights, update-pending and document access).
4. vNext `src/db/schema/profiles.ts`, `src/db/schema/placements.ts` (academic evidence lines 609–687), `src/modules/people/profile-service.ts`, `src/modules/people/profile-repository.ts`, `src/modules/people/profile-validation.ts`, `src/db/schema/memberships.ts`.
5. Existing source census `docs/planning/db-pass4-columns-db04_profiles_and_verification.json`: **7 tables, 103 fields; 7 tentative same-name matches**. A match is not verification.

### Legacy candidate-by-candidate disposition
| Legacy candidate | Source fields | Existing vNext target / relationship | Decision |
| --- | ---: | --- | --- |
| `profile_verification` | 15 | No dedicated equivalent in `profiles.ts` | **REQUIRED** current per-section state; must distinguish submitted from verified snapshot |
| `profile_verification_event` | 10 | No dedicated equivalent in `profiles.ts` | **REQUIRED** immutable submit/review history |
| `learner_academic_record` | 18 | `placement_candidate_academic_evidence` partial match | **PARTIAL**: exact grade/scale/max, policy revision, imported/verified provenance unresolved |
| `qualification` | 24 | `learner_profiles.profile_document.education[]` candidate | **PARTIAL**: education entry identity, marksheets/document metadata, grade semantics and lifetime unresolved |
| `student_image` | 3 | No proven equivalence | **UNCLASSIFIED**: determine current UI/producer use and whether private object metadata replaces data URI/blob |
| `student_registration` | 22 | `college_memberships`, `program_enrollments`, learner profile candidates | **CROSS-DOMAIN**: DB01/DB02 coordination required; never silently retire external_ref, source/synced-at, status/version |
| `approver_id_card` | 11 | No proven equivalent | **UNCLASSIFIED**: investigate exam/approver business usage before keep/retire decision |

**Current coverage:** 0/103 fields have completed exact semantic mapping and executable verification. The 103 are a **source ledger**, not an assertion that all should become target columns or that this exhausts runtime metadata. Profile JSON subfields, uploader metadata and later code-driven mutations require independent producer/consumer checks.

## 3. Confirmed gaps and risk ledger
| ID | Severity | Source-backed observation | Required closure |
| --- | --- | --- | --- |
| DB04-01 | CRITICAL / functional | vNext `learner_profiles.profile_document` is editable but has no persistent submitted/verified snapshots, statuses or reviewer authority; legacy V187 requires both a current row and a review history | New state/history schema + transactional service + negative tests |
| DB04-02 | CRITICAL / privacy | vNext `learnerProfileDocumentSchema.identity` allows raw Aadhaar/PAN strings, and `upsertOwnLearnerProfileDocument` persists validated document JSON to ordinary `learner_profiles.profile_document` | Review storage/logging/API exposure and move sensitive secrets into access-checked encrypted field(s) or vault; only masked snapshot fields; redact normal responses |
| DB04-03 | HIGH / parity | Existing `placement_candidate_academic_evidence` has percentage basis points and CGPA hundredths, but no `marks_json` original grade+scale+max and no persisted CGPA conversion formula/version | Round-trip original 9.2/10 CGPA and comparable %; preserve policy revision and provenance |
| DB04-04 | HIGH / stale action | Legacy VERIFIED → UPDATE_PENDING keeps old verified snapshot; vNext has no modeled atomic revision/reviewer compare-and-swap | Unique per membership+section; versioned state transition; stale competing reviewer rejected |
| DB04-05 | HIGH / authorization | V187 requires college admin / scoped super admin / enabled TPO **admin** reviewer; TPO coordinators are not reviewers | Central policy grants and same-college checks; default-on college setting with override and revocation |
| DB04-06 | HIGH / document security | Legacy design acknowledges public raw-object access as a vulnerability; vNext learner education entries have no dedicated secure marksheet reference or receipt table | Private GCS object keys, owner/college/purpose, content hash, upload receipt, malware/size checks, authorization on download; never long-lived public URLs |
| DB04-07 | HIGH / workflow | Legacy quick-verification audit explicitly fixed blind Identity verification and blind replacement of approved snapshot; the vNext state model cannot yet enforce both | Reviewer must inspect mandatory uploaded document evidence; show changed fields and currently-effective snapshot |
| DB04-08 | MEDIUM / modeling | `qualification`, `student_image`, `student_registration`, `approver_id_card` have no domain-level retirement/equivalence sign-off | Audit current legacy readers/writers + active MySQL metadata; map or explicitly retire with evidence |

Observations about **absence** are scoped to the inspected `profiles.ts`, profile services and identified academic evidence schema; a whole-repo search and live DB introspection remain separate gates.

## 4. Target relational design proposal — not implementation
### A. `profile_verifications`
- `id` UUID PK, `learner_membership_id` UUID FK, `college_id` UUID FK or tenant-resolved ownership, `section` EDUCATION/IDENTITY, `status` SUBMITTED/SENT_BACK/VERIFIED/UPDATE_PENDING.
- `submitted_snapshot` JSONB with schema version and redacted identity fields; `verified_snapshot` JSONB with schema version; independently recorded `submitted_at`, `verified_at`.
- `decided_at`, `decided_by_user_id`, optional reviewer membership/role, name-at-decision, `note`, `row_version`, `created_at`, `updated_at`.
- Unique `(learner_membership_id,section)`, status/section/college reviewer queue indexes. CHECK section/status, row version positive, SENT_BACK note non-empty, UPDATE_PENDING verified snapshot present, VERIFIED verified snapshot and verifier present.
- **Critical:** a plain FK to membership + separate college FK does not enforce equality; use composite parent integrity (e.g., `UNIQUE (id,college_id)` parent with composite child FK) or a reviewed DB trigger, plus service-level tenant authorization. No cross-tenant insert allowed even via direct SQL.

### B. `profile_verification_events`
- UUID PK, verification FK, learner membership/college FK or safely derivable from verification; ordered event sequence; action SUBMITTED/UPDATE_SUBMITTED/VERIFIED/SENT_BACK; actor identity/membership and role, actor name snapshot, timestamp, note, snapshot payload **redacted**, previous/new row version.
- Append-only DB restriction: reject UPDATE/DELETE in application role, handle legitimate retention policy through separately privileged audited flow.
- Index verification+time/sequence, learner+section+time; immutable history must not change when learner edits profile or reviewer name changes.

### C. `learner_private_documents` (storage contract, implementation GCP-blocked)
- UUID PK, owning membership/college, education entry UUID if applicable, `purpose` IDENTITY_AADHAAR/IDENTITY_PAN/EDUCATION_MARKSHEET/RESUME, private GCS key, object generation, MIME, byte size, SHA-256 digest, uploader and timestamp, scan/receipt status, revoked/deleted/retained timestamps.
- The object **key** is metadata, not a public URL; signed access issued only after a fresh owner/reviewer policy check.
- Submission verifies possession of accepted upload receipts **before** writing SUBMITTED. Identity completeness: Aadhaar number+matching document OR PAN number+matching document. Education completeness: 10th + 12th/Diploma + current UG/PG marks and respective marksheets, plus resume, per legacy design.
- File storage remains an execution blocker until private GCS is configured and tested. Never pretend an unresolved key points to an uploaded document.

### D. Original academic marks + conversion
- Preserve source `marks_json` semantic content as typed, validated per-level grade/scale/max (10TH/12TH/DIPLOMA/UG/PG) **alongside** the comparable normalized percentage, not instead of it.
- Persist or version the **college conversion formula in force at verification** and the transformed value so later config edits cannot silently rewrite historical approved eligibility.
- Keep `SELF` data distinct from `VERIFIED` evidence with reviewer/time and linkage to verification version. Existing `placement_candidate_academic_evidence` is a consumer; avoid DB08 eligibility redesign here.
- Validate decimal precision, unsupported formulas, null/missing distinctions, rounding modes and an original 9.2/10 test under `X9_5`, `MINUS_0_5_X10`, `MINUS_0_75_X10` and `X10` formulas.

## 5. Workflow/state contract
No database row for derived `INCOMPLETE` and `READY`. Actual persistence begins with submission.

| Current | Action | Next | Effective placement values |
| --- | --- | --- | --- |
| no row / SENT_BACK | learner submits complete current section | SUBMITTED | self-reported (unless prior verified snapshot exists) |
| SUBMITTED | eligible verifier sends back with nonempty reason | SENT_BACK | self-reported, or prior verified snapshot if present (needs explicit legacy check) |
| SUBMITTED | authorized reviewer approves with documents reviewed | VERIFIED | newly approved verified snapshot |
| VERIFIED | learner edits current profile | VERIFIED + derived changed-since-verified | **existing** approved values |
| VERIFIED | learner submits changed section | UPDATE_PENDING | **existing** approved values |
| UPDATE_PENDING | authorized reviewer approves | VERIFIED | new verified snapshot, old preserved in event |
| UPDATE_PENDING | authorized reviewer sends back | SENT_BACK or reviewed legacy-approved variant | **old approved snapshot remains**; inspect exact legacy display state |

Implementation must inspect the final sent-back-from-update behavior in legacy service, not assume `SENT_BACK` always means `SELF` evidence. Guard every action by membership status, role, college, document receipts and an expected row version. Event append + current-row transition + academic evidence publication are **one transaction**. On conflict, only one reviewer wins.

## 6. Role and privacy authorization matrix
| Actor | Edit own draft | Submit own | Read own | Review/decide | Download private docs |
| --- | --- | --- | --- | --- | --- |
| ACTIVE learner | yes | yes | yes | no | own only |
| same-college College Admin | managed corrections only if explicit | no impersonation | authorized | yes | same-college verifier purpose |
| scoped Super Admin | narrowly authorized | no impersonation | scoped | yes | scoped purpose |
| same-college TPO admin + setting ON | no | no | queue scope | yes | reviewer purpose |
| TPO coordinator / TPO when OFF | no | no | only non-sensitive allowed aggregates | no | no |
| faculty/mentor/recruiter / foreign college | no | no | no private fields | no | no |
| suspended or ended memberships | no | no | as explicitly permitted by retention policy | no | no |

Centralized `permissions/policy.ts` must own reviewer entitlement, and the college setting must be resolved **at action time**, not just when rendering the queue. Audit all normal logs, JSON responses and event payloads for identity/secret leakage.

## 7. Acceptance checklist — no unchecked item may be called done
### Migration + SQL
- [ ] exact field crosswalk for 103 source fields with keep/redesign/retire, types/null/default/index/history and producer/consumer evidence
- [ ] source migration 187/192 service behavior and any intervening fixes audited at frozen legacy SHA
- [ ] canonical Drizzle schema, fresh generated migration, snapshot/journal review (number chosen only after DB03 rebase)
- [ ] disposable PostgreSQL replay and catalog introspection (tables, FKs, checks, indexes, triggers, grants)
- [ ] direct-SQL forged cross-college verification/asset writes rejected
- [ ] private-event UPDATE and DELETE prohibited for application DB role
### State + concurrency
- [ ] incomplete/ready are derived and never persisted as fake review records
- [ ] submit → sent back → resubmit → verify → changed → update pending → approve
- [ ] old verified snapshot remains effective while update pending or sent back
- [ ] two reviewers racing same expected version: exactly one wins; one event per accepted mutation
- [ ] retry/idempotency key prevents double submit/review event
- [ ] status/actor/reason/timestamp constraints reject malformed direct writes
- [ ] learner cannot self-verify; inactive reviewer, TPO coordinator, toggled-off TPO denied
- [ ] cross-college reads/writes/downloads denied including guessed IDs and stale sessions
### Documents + marks
- [ ] Aadhaar/PAN not exposed unmasked in verification snapshots, logs, queue, API or URLs
- [ ] submit fails without corresponding identity/education document receipts + resume
- [ ] only signed short-lived, access-checked private download; revoke/retention tested
- [ ] audit direct `learner_profiles.profile_document` storage of raw ID numbers and decide encrypted-vault remediation
- [ ] raw 9.2/10 CGPA and normalized % round-trip under each college policy; historical policy revision retained
- [ ] verified values used by Students/TPO/eligibility consumer; self-edit doesn't override it
### Evidence + cross-account
- [ ] source SHA, vNext SHA, exact tests executed, browser verification, file workflow and exception sign-off recorded
- [ ] real UI learner submit + College Admin/Super Admin/TPO queue review + updates + TPO Students list checked
- [ ] no legacy-to-vNext data migration work; all test data synthetic

## 8. First next coding batch
1. Independently inspect legacy `profile verification` controller/service methods to resolve UPDATE_PENDING → SENT_BACK and bulk/quick-review semantics; record decisions in this doc.
2. Implement **only** current verification row + immutable events on this branch with tenant-safe FKs and pure state-transition domain logic/tests. Leave shared journal/0037 untouched until DB03 finishes.
3. Next batch: private file receipt/access model and academic-grade provenance (coordinate with DB08).
4. Run all PostgreSQL/typecheck/build/E2E gates; merge only after fresh `db-parity-2026` head verification. Mark `FIXED` only when code exists, never `VERIFIED` without executed evidence.

**Last audit conclusion:** This branch adds a non-overlapping source-backed DB04 contract and a precise release gate, **not** a claim of database parity or production-ready verification.
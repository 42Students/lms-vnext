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
- Persist provenance for the **college conversion formula used** and normalized result at each calculation. **Critical exact-legacy exception:** `AcademicMarksService.saveRule` intentionally recomputes current comparable percentages for the entire college after a rule change and writes a `CGPA_RULE_CHANGED` audit entry. vNext must preserve this administrative recompute behavior while keeping raw verified grade/scale/max immutable; adding historical conversion-version evidence is an additive audit improvement, not a reason to freeze current derived percentages.
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
| UPDATE_PENDING | authorized reviewer sends back with reason | **VERIFIED** | **old approved snapshot remains**; event records SENT_BACK and reason |

Legacy service confirms sent-back of an unverified first submission becomes SENT_BACK, but sent-back of an UPDATE_PENDING request restores VERIFIED and retains the old approved values. The event action is SENT_BACK in both cases. Any vNext implementation must preserve that distinction. Guard every action by membership status, role, college, document receipts and an expected row version. Event append + current-row transition + academic evidence publication are **one transaction**. On conflict, only one reviewer wins.

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
- [ ] raw 9.2/10 CGPA and normalized % round-trip under each college policy; admin rule change recomputes current percentages and logs the action, while historical raw marks remain unchanged
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
## 9. Legacy implementation confirmation — 2026-10-10

Service-level inspection at `lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5` of `service/tpo/ProfileVerificationService.java` and `service/tpo/AcademicMarksService.java` confirms:

1. `submit()` is transactional; initial and returned-for-fix submission writes SUBMITTED, a changed VERIFIED profile writes UPDATE_PENDING, and identical submitted versus verified snapshot is rejected. It logs SUBMITTED or UPDATE_SUBMITTED.
2. `verify()` is transactional; it accepts only SUBMITTED or UPDATE_PENDING, moves to VERIFIED, copies submitted to verified, writes academic evidence for Education, appends VERIFIED event and enqueues a notification.
3. `sendBack()` is transactional; it requires a reason (at least 3 characters), accepts only pending states, returns an UPDATE_PENDING review to VERIFIED **without replacing the prior verified snapshot**, but returns an initial SUBMITTED review to SENT_BACK. It appends SENT_BACK event and notification in both cases.
4. `verifierCollege()` allows only College Admin, scoped Super Admin, or authorized TPO admin, with TPO permission default ON and college-configurable. A TPO coordinator never qualifies.
5. `requireDocumentsForBlindVerify()` only blocks the quick/bulk blind path when documents are missing; an opened individual review route is not prohibited by that helper. This is important for **behavioral parity**: mandate human review and explicit security exception rather than falsely claiming all legacy verification paths already enforce uploaded evidence.
6. `AcademicMarksService.saveRule()` deliberately recomputes the comparable verified percentages when the college changes its CGPA conversion policy and audits that rule change; raw marks-as-earned are retained separately. Do **not** freeze percentage values at verification time and silently break this workflow.
7. Current legacy updates use a read then status-only UPDATE by learner and section; there is no visible expected-row-version predicate. vNext must add compare-and-swap/row-lock protection as a documented concurrency safety improvement, and test it.

**New exact behavior gate:** verify-many is per-item best-effort and returns verified count plus individual failed rows, not all-or-nothing across the batch; a state-safe implementation should preserve that user-visible outcome. Remaining source audit includes the exact frontend UI and document download/retention path.

## 10. Implementation progress — 2026-10-10 isolated DB04 branch

The source audit has now become a staged implementation. **No DB04 schema migration, API, private GCS workflow, or PostgreSQL integration has been applied or executed.**

- **Pure domain planner:** `src/modules/profile-verification/domain.ts` models SUBMITTED, SENT_BACK, VERIFIED and UPDATE_PENDING; preserves old verified values during rejected updates; enforces expected row versions; emits immutable *event plans*; rejects raw Aadhaar/PAN numbers, insecure document URLs and invalid upload references in verification snapshots. These are defense-in-depth guards, not a replacement for a complete producer schema or encrypted identity storage.
- **Server service contract:** `src/modules/profile-verification/service.ts` resolves membership/college from server-owned records, requires the learner's own ACTIVE membership for submit, and checks reviewers with centralized policy. A repository adapter must guarantee locked row + current-state mutation + event insert **and academic evidence publication** in one transaction. That adapter does not yet exist. Do **not** wire routes before it does.
- **Centralized reviewer policy:** `src/modules/permissions/policy.ts` now handles `profile-verification.review`: scoped SUPER_ADMIN, same-college COLLEGE_ADMIN, or same-college TPO **administrator** with college setting ON (both facts obtained from trusted server repository reads, never request input). TPO coordinators are not reviewers.
- **Staged Drizzle types:** `src/db/schema/profile-verification.ts` defines profile verification rows, events, and private document receipt metadata with keys/checks/indexes. It is intentionally **not exported by `src/db/schema/index.ts` and has no migration number** while DB03 changes `drizzle/0037_*` and the migration journal. Event immutability trigger/DB grants and direct-SQL tenant proofs are still missing.
- **Original grades:** `src/modules/profile-verification/academic-marks.ts` implements source-inspired BigInt rational/HALF_UP conversion of percent, CGPA, GPA/grade, with the four rule keys. Original grade/scale/max remain intact across effective-percentage recompute. This is a pure calculation helper, not a college setting/revaluation persistence workflow.
- **Authored unit tests (not run in GitHub):** `tests/unit/db04-verification-domain.test.ts`, `db04-verification-service.test.ts`, `db04-verification-policy.test.ts`, `db04-academic-marks.test.ts` cover state semantics, stale actions, multi-tenant reviewer denial, document gates, privacy and mark conversions.
- **Limited local checks:** standalone `tsc --strict --noEmit` + Node smoke checks passed for local equivalents of the pure state/marks modules. This is *not* evidence that GitHub's full repository typecheck or tests passed.
- **CI status:** latest branch CI check reports FAILURE, but the job step list is empty and log retrieval returned a 404. `main` and active `db-parity-2026` runs also report failure. Cause is **unconfirmed**. No DB04 implementation/test sign-off is possible until build and execution become observable.

**Highest-priority next batch:** secure repository adapter + transactional SQL event write + checked document evidence producer, then full source field crosswalk, mark provenance/college rule persistence, isolated PostgreSQL negative writes, and final UI parity. Rebase on active DB03 branch with migration journal review **before** enabling or merging this staged schema.

The canonical machine-readable ownership and evidence queue remains `docs/planning/database-parity-db04-parallel-tracker.json`. Coordination issue #2 and draft PR #3 track the same branch.

## 11. Further isolated batch: source-backed verification evidence + profile validator bugfix

- `src/modules/profile-verification/evidence.ts` now derives EDUCATION/IDENTITY submission readiness from owner-scoped CLEAN private upload receipts. It requires 10th, 12th or Diploma, UG/PG, marks and marksheets for each education entry, plus a résumé; Identity requires Aadhaar or PAN evidence matching every ID number supplied. Revoked/expired/unscanned, wrong-owner, public-URL, bad-hash and oversized receipts fail closed.
- `tests/unit/db04-verification-evidence.test.ts` covers the matrix. Standalone local source-mirror TypeScript and smoke checks passed, not full-repo Vitest or PostgreSQL checks.
- Concrete vNext profile validation defects found and corrected in `src/modules/people/profile-validation.ts`: phone pattern formerly contained literal `[d]` / `[ds-]` rather than numeric digits; four year fields used literal `d{4}` rather than `\\d{4}`. New `tests/unit/db04-profile-document-format.test.ts` checks real phone and years. **Repository regression suite not executed**.

### Parity/security exception requiring approval
The production legacy `ProfileVerificationService.verify()` individual-review path does not universally enforce uploaded document evidence, although its bulk/quick-review path does. DB04 staged service requires an accepted private evidence receipt for every approval. This is an **intentional security hardening deviation** motivated by avoiding blind identity checks, not a claim of identical legacy behavior. Keep this exception open until explicit product/security sign-off; do not silently label this family parity VERIFIED.

### Unresolved risk
Raw Aadhaar/PAN strings remain supported in the existing `learner_profiles.profile_document` JSON; the new snapshot guard does not remediate that underlying profile storage. Do not expose verification APIs until private identity storage, redaction, encryption, document authorization, migration and associated negative tests are resolved. The Drizzle staging file is still unregistered and no live database has been modified.

## 12. Continuation checkpoint — expanded DB04 source implementation (2026-10-10)

**Ownership:** This branch remains independent of active `db-parity-2026` (DB03 at least through migration `0040`). Do not rebase/merge while overlapping migration work is uncontrolled. Draft PR #3 remains an implementation proposal, not a release.

**New persisted-domain modules authored:**
- `transaction-writer.ts` uses transaction-scoped advisory lock for same learner+section (including simultaneous first submit), college row lock, membership and verification row locks, CAS row version, and all-or-nothing current review row/event writes.
- `academic-publication.ts` publishes original marks with percent/rule/version provenance and updates `placement_candidate_academic_evidence` **inside** the same approval transaction. `settings-service.ts` deliberately recalculates percentages across current college verified records on rule changes while leaving original grade/scale/max intact; writes an activity event.
- `transaction-writer.ts` also writes activity and in-app notification on approval/send-back in the same transaction, without including identity numbers or grades.
- `tpo-grants-service.ts` grants or revokes explicit same-college TPO admin reviewer rights and logs them. Reviewer permission is reevaluated once inside the college-locked review transition to close revoke-versus-decision races.
- `repository.ts` resolves learner ownership, TPO grants and settings through server-side PostgreSQL reads, constructs masked snapshots and validates receipt IDs from immutable **submitted** evidence rather than comparing later editable profile state.
- `gcs-private-receipts.ts` defines a fail-closed GCS metadata verifier requiring uniform bucket-level access, enforced Public Access Prevention, exact generation/size/type/SHA-256 and privileged malware scan attestation. It has **not** been executed against any GCP bucket. A trusted scanner and IAM/upload controls do not yet exist.

**Privacy stop-gap:** The existing learner profile service and repository now explicitly reject attempts to persist new raw Aadhaar/PAN values in generic `learner_profiles.profile_document`. This is an intentional temporary functional restriction; an encrypted identity vault, safe masking/decryption rules, migration of existing raw test/prod rows if any, UX mapping and verified identity flow are still necessary. Do not call identity verification feature-complete with that restriction.

**Physical migration candidate:** `docs/planning/db04-proposed-migration.sql` declares six tables, immutable event trigger, revision guard and composite learner+verification FK. It is outside the active Drizzle journal and must be regenerated/reconciled against `src/db/schema/profile-verification.ts`, replayed on disposable PG, inspected via catalogs and stress-tested **before** it is promoted. Seven static source structural checks passed. This is NOT SQL runtime evidence.

**Source field crosswalk:** `docs/planning/db04-field-crosswalk-proposals.json` now enumerates all 103 legacy DB04 source fields with type/null/default/risk/proposed target: **67 target proposals, 0 field mappings verified, 0 retirement approvals**. Do not convert matching names into closure without producer/consumer and live metadata evidence.

**Regression suite drafted:** under `tests/unit/db04-*.test.ts` for state transitions, reviewer/tenant permissions, private receipt completeness, submitted document immutability, marks conversion, old profile validation bugfix, raw ID rejection and source schema structure. Actual repository Vitest and PostgreSQL execution **not verified**. Limited local mirrors of previous pure modules passed 13 state, 5 evidence and 13 academic assertions; those are not evidence for newly added DB transaction modules.

### Mandatory next steps before release
1. Refresh and rebase onto stable `db-parity-2026` after DB03; resolve `0040+` migration journal, Drizzle generated snapshot and composite FK/trigger DDL.
2. Run `npm run db:generate`, SQL replay, `npm run typecheck`, `npm test`, `npm run test:db`, `npm run build`, browser tests on disposable infrastructure; add real negative cross-college direct-SQL, race/rollback and privacy tests.
3. Provision/configure non-public GCS bucket, scanner attestations, signed upload/download IAM, encrypted Aadhaar/PAN storage, retention/deletion and audit. Public routes intentionally remain unwired until this gate passes.
4. Wire learner submit and College Admin/Super Admin/TPO verifier queue, bulk per-item decisions, settings, status cards, badges, notifications and all producer→consumer workflows. Freeze FE/BE oracle SHAs for final parity.
5. Resolve remaining DB04 historical candidates (registration, images, approver card), prove all 103 source fields mapped or approved retired, and document security-hardening behavior exceptions.
6. Investigate GitHub CI failures: branch, shared DB03, and main report failing jobs without useful step logs. Do not claim full green gates until they execute.

This checkpoint is **partial implementation with explicit release blockers**, not DB04 completion. The next chat should use `docs/planning/database-parity-db04-parallel-tracker.json` as operational queue.

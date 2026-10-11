# DB04 historical registration / approver-card peer review

**Peer reviewer:** Chat 1  
**Task owner:** Chat 3 / DB-007  
**Observed:** 2026-10-11  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

This is source-only evidence. It does **not** approve retirement, register a migration, or claim PostgreSQL/runtime verification.

## Post-V150 migration sweep

Every checked-in legacy backend Flyway migration from **V151 through V194** was fetched from the frozen backend SHA and scanned for:

- `student_registration`
- `approver_id_card`
- `assigned_exam`

Result:

- migrations scanned: **44**
- range: **V151–V194**
- matches: **0**

Therefore neither historical contract was evolved, renamed, explicitly backfilled, nor explicitly dropped by the checked-in post-V150 Flyway chain. Physical table presence in a deployed legacy database remains separately unverified.

## `student_registration` is not placement registration

The historical table has **22 fields**:

`id, tenant_id, organization_id, college_id, learner_id, external_ref, registration_number, student_name, phone, email, program_id, class_id, batch_year, semester_number, registration_status, source, synced_at, metadata, version, created_at, updated_at, is_deleted`.

Its source constraints are:

- unique `(tenant_id, external_ref)`;
- unique `(tenant_id, learner_id)`;
- unique `(tenant_id, registration_number)`;
- index `(tenant_id, registration_status)`;
- index `learner_id`;
- index `(organization_id, college_id)`.

Those fields/keys describe a tenant-scoped external intake/synchronization ledger: external idempotency/correlation, pre-linked contact snapshots, source/status, last sync time, arbitrary source metadata and optimistic versioning. `learner_id` is nullable, so a row can exist before a canonical learner is linked.

The frozen current placement registration path is materially different:

- `LearnerRegistrationController` returns/writes `PlacementRegistration`;
- `BatchRegistrationService` calculates a learner's batch window from `learner`, `class`, `batch`, `placement_batch`;
- “not chosen yet” checks `placement_registration` and `job_application`;
- the learner registers a placement/higher-studies/not-interested **choice** for an already authenticated learner.

Therefore **do not map `student_registration` to `placement_registration`**. The historical table either represents an external/pre-enrollment import contract that still needs a vNext ingestion design, or is an old integration that needs explicit retirement evidence.

Frozen BE/FE tree-path inspection found no exact-name `student_registration` source path. This strengthens the retirement candidacy but does not prove absence of native SQL, scheduled integration, another deployed service, or an external DB consumer.

## `approver_id_card` is tied to a historical assigned-exam workflow

The historical table has **11 fields**:

`id, created_at, is_deleted, updated_at, cloud_storage_object, encoding, media_code, mimetype, original_name, url, assigned_exam_id`.

Its only declared relationship is:

`approver_id_card.assigned_exam_id -> assigned_exam.id`.

Frozen backend/frontend tree-path inspection found no current `AssignedExam`, `ApproverIdCard`, approver-card, or assigned-exam implementation path.

The current backend exam code found in this sweep is `ExamConfig` / `QualifyingExamConfigUtil`, which is a learner-profile catalog for qualifying exams (JEE, CAT, GATE, etc.). That is semantically unrelated to an approver identity-card file belonging to an assigned-exam workflow.

Therefore **do not map `approver_id_card` to learner identity/profile documents** merely because both are files, and do not map its `assigned_exam_id` to current qualifying-exam profile configuration.

This is a strong historical-subsystem retirement candidate, but explicit retirement/product signoff or detached/native/external-consumer evidence is still needed.

## DB-007 disposition impact

The source questions can now be narrowed:

| Historical concept | Current-source result | Safe automatic mapping? | Remaining decision |
| --- | --- | --- | --- |
| `student_registration` | No exact-name source path; no V151–V194 change; current learner registration uses placement-specific tables and a different job | **No** | Retire external/pre-enrollment sync, or design a dedicated canonical intake/import contract |
| `approver_id_card` | No exact-name assigned-exam/approver implementation path; no V151–V194 change; current qualifying-exam profile code is unrelated | **No** | Explicitly retire historical assigned-exam subsystem, or identify a detached/external consumer |

The post-V150 migration uncertainty is source-closed for both tables. Runtime physical presence and external DB consumers remain unverified.

## Suggested closure standard

A retirement decision should state that vNext intentionally excludes the external `student_registration` intake/sync job and/or historical assigned-exam approver-card subsystem. If either remains required, it should receive a purpose-built normalized contract rather than a same-name table clone or an incorrect mapping into placement/profile persistence.

# DB06 private assignment upload receipt and file-evidence contract

**Observed:** 2026-10-11 IST  
**Global phase:** DATABASE  
**Queue task:** DB-053 · **Worker:** Chat 1  
**Status:** source-only hardening; runtime remains fail-closed; no migration/API cutover or PostgreSQL verification.

Canonical source artifacts:

- src/db/schema/course-upload-receipts-staged.ts
- docs/planning/sql/db06-assignment-upload-receipt-hardening-candidate.sql
- tests/db06-assignment-upload-receipt-staging.test.mjs
- docs/planning/database-parity-db06-field-reconciliation.json

Cross-domain input:

- docs/planning/database-parity-db16-private-storage-safety.md
- docs/planning/sql/db16-private-object-receipt-overlay-candidate.sql

DB-053 supersedes only the DB06 course-upload-receipt portion of the older DB-016 overlay. DB04 profile/private-document receipt work remains separate.

## Source parity and redesign boundary

Pinned legacy AssignmentUploadReceipt persists a one-time receipt, storage key, learner owner, assignment/lesson-content target, declared/actual MIME and size, expiry, consumption time, and consumed student assignment.

Pinned legacy AssignmentServiceImpl validates receipt ownership/target/expiry/object metadata and supports submission_assets as a **list**. Every uploaded file needs a unique receipt. A submission with multiple items becomes MULTI_PART and may contain multiple uploaded files.

The legacy persistence is not copied literally because it also permits a public_url field and lacks immutable object generation, cryptographic digest, malware-scan evidence, auditable revocation, retention and deletion lifecycle.

Normalized DB06 decisions:

- no public URL is authoritative private-object identity;
- private object key is membership/college/purpose scoped;
- opaque upload token is stored only as SHA-256 hash;
- assignment receipt is bound to exact assignment **and delivery**;
- actual object generation/MIME/size/SHA-256 are attested before consumption;
- privileged scanner identity/time are persisted;
- receipt revocation is auditable and irreversible;
- retention is explicit before consumption;
- deletion cannot start before retention ends;
- consumed receipt/object identity is immutable;
- persisted file evidence must exactly equal the consumed receipt;
- multiple distinct receipts/files may bind to one submission in stable sequence order;
- private file/read runtime remains disabled until migration + producer/read cutover + execution evidence.

## Staged receipt shape

course_upload_receipts includes:

- college_id;
- owner_membership_id;
- purpose;
- assignment_id;
- delivery_id for assignment submissions;
- lesson_content_id for course-resource target;
- object_key;
- upload_token_hash;
- original_name;
- declared_content_type / declared_size_bytes;
- expires_at;
- attested_generation;
- actual_content_type / actual_size_bytes / sha256_hex;
- scan_status / scan_attested_by / scan_attested_at;
- consumed_at / consumed_by_submission_id;
- revoked + revoked_at / revoked_by_user_id / revocation_reason;
- retention_until;
- deletion_requested_at / deleted_at;
- created_by_user_id / created_at / updated_at.

### Object/grant constraints

The staged Drizzle model requires:

- purpose is ASSIGNMENT_SUBMISSION or COURSE_RESOURCE;
- assignment receipts have assignment_id + delivery_id and no lesson_content_id;
- course-resource receipts have lesson_content_id and no assignment_id;
- object key begins with the exact private/<college>/<membership>/<purpose-namespace>/ prefix;
- upload token hash is lowercase 64-char SHA-256;
- original file name is non-empty, <=255 and path-free;
- declared MIME is non-empty and <=128;
- declared size is 1..50 MiB;
- expiry is after creation and at most 15 minutes after creation;
- scan state is PENDING/CLEAN/REJECTED;
- PENDING has no scanner actor/time; terminal CLEAN or REJECTED requires exact lms-vnext-privileged-scanner + attested timestamp;
- object generation is numeric and attested SHA is lowercase 64-char hex;
- at consumption time the receipt must be CLEAN, unrevoked and fully attested, with scan_attested_at <= consumed_at <= expires_at and retention_until >= consumed_at; later administrative revocation does not invalidate the historical consumption snapshot;
- revocation requires boolean + actor + time + reason together;
- deletion request requires retention and cannot precede retention_until.

The SQL guard additionally requires assignment MIME to match the active assignment upload allowlist, closing direct-SQL bypass of application validation.

## Exact owner / target / delivery binding

At receipt INSERT, the SQL guard validates:

- owner membership is ACTIVE;
- owner user is ACTIVE;
- owner membership college equals receipt college;
- created_by_user_id equals the membership user;
- assignment receipt owner has LEARNER role;
- assignment and learning path are PUBLISHED;
- assignment derives the same college;
- receipt delivery belongs to the assignment offering;
- delivery-specific assignment, when present, equals receipt delivery;
- registered DB06 learner/delivery roster logic accepts the learner for that delivery.

This last point deliberately reuses registered db06_guard_learner_delivery from 0042 rather than copying elective/section roster rules.

For COURSE_RESOURCE, the target lesson-content college and delivery audience must equal the receipt scope. Runtime producer support for COURSE_RESOURCE remains a separate cutover decision.

## One-way receipt lifecycle

Receipt grant/object identity is immutable from creation:

- college/owner;
- purpose and target IDs;
- assignment delivery;
- object key;
- token hash;
- original name;
- declared MIME/size;
- expiry;
- creator and creation time.

Scanner result is one-way. CLEAN/REJECTED cannot later be rewritten to another result.

Attestation may be populated once. Once generation/MIME/size/hash/scanner evidence exists, it cannot be changed.

Revocation is irreversible and actor/time/reason become immutable once written. An active owner may cancel only an **unconsumed** receipt. A consumed receipt may be revoked only by an active same-college COLLEGE_ADMIN or persisted active SUPER_ADMIN; DB-053 deliberately does not invent FACULTY revocation authority.

Post-consumption revocation is valid: it disables future reads without rewriting the historical consumed/object/file evidence. Therefore the structural consumed-row contract does not require `revoked=false` forever; the transition guard requires unrevoked state only at the moment of consumption.

Retention may be established or extended, never shortened. Deletion request/completion timestamps are write-once, and deletion requires prior revocation in addition to the retention boundary.

Consumption is one-time and cannot be cleared or reassigned.

## Safe assignment consumption

A receipt may be consumed only when all of the following are true:

- purpose is ASSIGNMENT_SUBMISSION;
- receipt has exact assignment and delivery;
- submission exists and submission_type is FILE at current single-file API cutover, or a later normalized multi-part container explicitly supports file assets;
- submission assignment matches receipt assignment;
- submission delivery matches receipt delivery;
- submission membership matches receipt owner;
- submission derives the same college;
- assignment audience/offer matches submission delivery;
- receipt has not expired;
- receipt is not revoked/deleting/deleted;
- scan is CLEAN with exact privileged scanner and timestamp;
- scan timestamp is no later than consumption;
- generation/hash/MIME/size are attested;
- actual MIME/size equal the declared grant envelope;
- retention_until exists and is >= consumed_at.

Current vNext service already locks a receipt FOR UPDATE and uses a consumed_at IS NULL / revoked=false CAS. DB-053 preserves that requirement and expands the persistence proof.

## Multi-file normalization

Legacy submission_assets is a list, and validateAndConsumeUploadReceipts consumes every distinct file receipt.

The old staged vNext relation incorrectly made assignment_submission_id the primary key of assignment_submission_files and made consumed_by_submission_id unique, limiting a submission to one file.

DB-053 corrects that source shape:

- assignment_submission_files gets its own UUID primary key;
- assignment_submission_id is a non-unique retained FK;
- upload_receipt_id remains unique;
- sequence is required and unique within the submission;
- optional title preserves file-asset presentation metadata;
- multiple receipts may share one consumed_by_submission_id;
- each receipt may still be consumed only once.

This is database parity staging only. Current submitAssignmentInputSchema accepts one FILE receipt and the current assignment submission type enum does not yet expose full MULTI_PART semantics. API/UI parity must cut over later.

## Exact consumed-attestation FK

The staged receipt owns a composite unique identity over:

- receipt id;
- consumed submission id;
- object key;
- attested generation;
- actual MIME;
- actual size;
- SHA-256;
- original filename.

assignment_submission_files has a composite FK from its receipt/submission/object metadata to that exact consumed attestation.

This prevents a file evidence row from drifting to:

- another submission;
- another object key;
- another generation;
- another MIME/size/hash.

The composite identity and SQL insert guard also pin original_name and require CLEAN, consumed, non-revoked, retained receipt state at file insertion.

## Deferred relational completeness

Two DEFERRABLE INITIALLY DEFERRED guards make the multi-file model complete at COMMIT rather than imposing a fragile statement order:

- a FILE `assignment_submissions` row must have at least one immutable `assignment_submission_files` row; a non-FILE submission must not own file rows;
- every consumed ASSIGNMENT_SUBMISSION receipt must have a matching immutable file row for its consumed submission.

This permits submission → receipt consumption → file insertion in one transaction while rejecting a dangling FILE submission and a consumed-but-unattached receipt.

## Producer ordering

The stricter composite FK intentionally makes the currently disabled file-before-receipt update ordering invalid.

Compatible FILE producer order must be:

1. validate/re-attest object outside or before the write transaction as appropriate;
2. inside one transaction, lock assignment/member/receipt;
3. INSERT assignment_submissions;
4. UPDATE/consume course_upload_receipts with generation/MIME/size/hash, CLEAN scanner actor/time, explicit retention_until and consumed submission;
5. INSERT one or more assignment_submission_files rows referencing the now-consumed exact attestation;
6. commit.

Every receipt consumption uses a CAS predicate such as consumed_at IS NULL, revoked=false, deleted_at IS NULL plus exact owner/assignment/delivery scope.

## Scanner timestamp is not fabricated

Current private-object-storage checks scan_attested_by but does not expose a trusted scan timestamp.

Promotion must require scanner metadata to contain a valid privileged scan timestamp and readPrivateObjectAttestation must return it. The producer persists that trusted value as scan_attested_at.

Do not use Date.now() or receipt-consumption time as fake scanner attestation time.

## Revocation and read path

Current createAssignmentFileReadGrant authorizes the submission and reads assignment_submission_files, but does not re-check the linked receipt lifecycle.

Before DB06_ASSIGNMENT_FILES_READY may become DB06_VERIFIED, the read path must join/read course_upload_receipts and refuse a signed URL when the receipt is:

- revoked;
- deleted or deletion-pending if policy disallows access;
- not CLEAN;
- scanner evidence missing/mismatched;
- object attestation different from immutable file evidence;
- outside the approved read-retention policy.

Revocation therefore becomes effective authorization state, not merely an audit column.

A consumed receipt may be revoked after file insertion. The immutable file row remains as evidence, while read authorization must fail from the linked receipt state.

## Retention

Consumed private evidence requires explicit retention_until. DB-053 does not invent the duration. Product/legal/data-retention policy must set the assignment evidence retention duration during producer cutover.

The database prevents shortening an established retention deadline and prevents deletion request before that deadline.

The receipt/file database rows themselves are retained as audit evidence; DELETE/TRUNCATE is rejected. deleted_at records physical-object lifecycle, not deletion of the evidence row.

## Runtime gate

assignmentFilesRuntimeEnabled currently requires:

DB06_ASSIGNMENT_FILES_READY=DB06_VERIFIED

Keep this fail-closed until:

- staged schema is integrated as a numbered migration;
- DB16/DB053 duplicate DDL is reconciled once;
- producer ordering and multi-file API model are cut over;
- scanner timestamp is trusted/persisted;
- read path honors revocation/deletion/attestation;
- disposable PostgreSQL and private-storage acceptance execute.

A committed staged schema is not sufficient to enable the feature.

## Required acceptance

Before registration/runtime enablement, execute at least:

1. wrong-college owner/creator receipt insert fails;
2. assignment owner without LEARNER role fails;
3. wrong assignment/delivery/audience fails;
4. malformed private path/token/file name/MIME/size/expiry fails;
5. exact PENDING -> CLEAN privileged attestation succeeds once;
6. scan outcome/attestation rewrite fails;
7. expired/revoked/deleting/deleted/non-CLEAN consumption fails;
8. MIME/size mismatch fails;
9. wrong assignment/member/college/delivery/submission binding fails;
10. consumed receipt cannot be reassigned/unconsumed;
11. multiple distinct receipts may bind one submission at unique sequences;
12. duplicate receipt or sequence fails;
13. file row before receipt consumption fails;
14. exact consumed receipt/file evidence succeeds;
15. key/generation/MIME/size/hash/name drift fails;
16. retention shortening fails;
17. deletion before retention fails;
18. receipt/file UPDATE/DELETE/TRUNCATE forbidden where immutable;
19. concurrent second consumer loses CAS;
20. unused owner revocation succeeds; unrelated/faculty revoker fails;
21. consumed receipt revocation requires same-college COLLEGE_ADMIN or active SUPER_ADMIN, freezes actor/time/reason and later blocks signed read;
22. deletion requires prior revocation;
23. FILE submission with zero files and consumed receipt with no file row fail at COMMIT; exact multi-file set commits;
24. revoked/deleted receipt cannot issue signed read;
25. scanner timestamp comes from trusted object metadata;
26. zero-to-head migration and snapshot drift pass;
27. readiness flag remains disabled until all gates pass.

Until those witnesses execute, DB-053 may be source-complete only and must not be DONE_VERIFIED.

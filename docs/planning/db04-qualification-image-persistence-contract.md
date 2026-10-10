# DB04 qualification + learner-image persistence contract (staged)

**Status:** STAGED DATABASE CONTRACT — not registered, not migrated, not runtime verified  
**Worker:** Chat 3 / DB-007  
**Date:** 2026-10-11  
**Legacy BE oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy FE oracle:** `e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`

This contract closes design ambiguity exposed by the DB-007 source pass. It does **not** authorize edits to `drizzle/**`, `src/db/schema/index.ts`, or the currently overlapping `src/db/schema/**` surface. Chat 1 remains the migration/schema-barrel integrator.

## 1. Source behavior that must survive

### Qualification / education

Production persists learner education in `qualification`. Current profile CRUD and frontend education surfaces actively use structured education type, program, specialization, institution, years, currently-pursuing, grading type, grade, max grade, qualifying exam/details and marksheet reference. Production screening also reads qualifications directly and treats both **CGPA and GPA** as valid GPA-like grading types.

Important no-surprise behaviors:

- education belongs to exactly one learner;
- deleted entries disappear from active reads;
- a currently-pursuing education may have no end year;
- grading type + grade + max grade are required by current profile writes;
- job screening consumes program, specialization, GPA/CGPA grade and graduation year;
- marksheets are learner-owned object references;
- legacy `is_recent_education` is persisted/sorted and participates in qualification-set validation;
- qualifying exam data has both a code and structured details, with an older `exam_rank` compatibility value.

The existing vNext aggregate `learner_profiles.profile_document.education[]` is useful for presentation but is too weak as the sole database source of truth for screening, verification, document FKs, row-level history and database constraints.

### Student image

Production `student_image` still has authenticated create/get/deactivate behavior. Its `image_data` payload represents a collection of `{ imageId, imageUrl, active }` entries owned by one learner. The storage path is checked against the learner.

A `PROFILE_IMAGE` upload receipt proves an object, but it does not replace the persisted image collection or its active-state semantics.

## 2. Proposed normalized vNext education table

Stage a canonical relation equivalent to:

```text
learner_profile_education_entries
  id uuid primary key
  learner_membership_id uuid not null
  education_type varchar(120) not null
  program varchar(200) null
  specialization varchar(200) null
  institution_name varchar(300) not null
  start_year smallint null
  end_year smallint null
  is_currently_pursuing boolean not null default false
  grading_type varchar(32) not null
  grade_obtained varchar(64) not null
  max_grade varchar(64) not null
  is_recent_education boolean not null default false
  qualifying_exam varchar(120) null
  exam_rank varchar(200) null
  exam_details jsonb not null default '{}'
  legacy_degree varchar(100) null
  legacy_field varchar(100) null
  legacy_score varchar(100) null
  legacy_description text null
  created_at timestamptz not null default now()
  updated_at timestamptz not null default now()
  archived_at timestamptz null
```

Required database invariants:

1. `learner_membership_id` references an existing college membership with restrictive delete semantics.
2. `grading_type` must include at minimum `CGPA`, `GPA`, `Percentage`, and `Grade`; do not silently reject the production-screened `GPA` value.
3. Years, when present, must be plausible four-digit years and `end_year >= start_year`.
4. `is_currently_pursuing = true` requires `end_year IS NULL`.
5. Grade and max-grade must be non-empty after trimming.
6. An active-row lookup must exclude `archived_at IS NOT NULL`; physical delete is not required for learner-facing removal.
7. Index learner + active state and the fields used by screening. Do not require JSON scans for the common screening path.
8. If `is_recent_education` remains product-visible/semantically required, enforce at most one active recent entry per learner with a partial unique index. If API-phase evidence proves it is only obsolete compatibility state, retire it explicitly rather than silently deriving a different meaning.
9. `exam_details` must be an object, not arbitrary JSON scalar/array. Exact per-exam keys remain an application boundary contract unless a stable DB shape is approved.
10. Legacy compatibility columns may be retired in greenfield only after API/UI parity confirms no current producer requires them. Keeping them nullable during parity is safer than silently discarding accepted payloads.

### Aggregate profile JSON

If `profile_document.education[]` remains for convenient document rendering, it should become a derived/read model or be transactionally generated from the normalized education relation. Two independently writable canonical copies are not acceptable.

## 3. Marksheets and education evidence

Do not store public/presigned URLs or raw bytes on an education row. Reuse the staged secure receipt model, but replace the currently unconstrained polymorphic `related_entry_id` pattern for education with an enforceable join relation:

```text
learner_profile_education_documents
  education_entry_id uuid not null
  receipt_id uuid not null
  purpose varchar(...) not null
  created_at timestamptz not null default now()
  primary key (education_entry_id, receipt_id)
```

Required invariants:

- education entry FK is restrictive;
- receipt FK is restrictive;
- receipt owner membership must equal the education owner membership;
- accepted purposes are explicit (`MARKSHEET`, `EDUCATION_CERTIFICATE`);
- revoked/expired/non-clean receipts cannot become effective evidence;
- no raw Aadhaar/PAN/secret identity value may enter education or receipt metadata.

The same-owner constraint may require carrying owner membership on the join and using composite unique/FK keys; prove it in PostgreSQL rather than relying only on service validation.

## 4. Proposed learner profile image relation

Stage a canonical relation equivalent to:

```text
learner_profile_images
  id uuid primary key
  learner_membership_id uuid not null
  receipt_id uuid not null
  display_order integer not null default 0
  is_active boolean not null default true
  created_at timestamptz not null default now()
  deactivated_at timestamptz null
```

Required invariants:

1. membership FK is restrictive;
2. receipt FK is restrictive and receipt purpose must resolve to `PROFILE_IMAGE`;
3. receipt owner must equal image owner;
4. `display_order >= 0`;
5. `is_active = false` and `deactivated_at` must agree;
6. object identity is receipt-backed; do not persist arbitrary client URLs as the canonical object;
7. indexes support active images by learner in display order;
8. duplicate receipt attachment to the same learner is rejected;
9. cross-tenant receipt/image attachment is rejected by a database witness, not merely by route code.

Whether profile images are publicly renderable is an access/delivery decision. Storage ownership and canonical persisted identity must remain explicit even if a derived CDN URL is later exposed.

## 5. Historical candidates deliberately NOT recreated

### `student_registration`

Do not create a vNext table from this name yet. The current production placement registration model is `placement_registration`, not `student_registration`. The 22-field historical table instead looks like external roster/CRM synchronization state. DB01/DB02 must prove native-SQL/external integration use or approve retirement.

### `approver_id_card`

Do not create this 11-field historical table by name alone. No named current producer/consumer path was found at the frozen backend oracle. Retirement still needs native-SQL/detached-consumer proof or explicit product approval.

## 6. PostgreSQL acceptance witnesses required before DB-007 can verify

At minimum execute, on a clean registered migration replay:

- reject cross-tenant education/document and image/receipt attachment;
- reject `GPA` only if product explicitly removes it; current parity expects it to be accepted;
- reject currently-pursuing education with a non-null end year;
- reject end year before start year;
- prove active/recent uniqueness under concurrent writes if `is_recent_education` remains;
- reject wrong receipt purpose and non-clean/revoked/expired receipt use;
- reject duplicate image receipt attachment;
- prove deactivation is idempotent and cannot mutate another learner's image;
- prove archived education disappears from active screening reads;
- prove screening uses the normalized canonical row, not stale duplicated profile JSON;
- prove migration replay and schema snapshot drift on the exact integration SHA.

**Current gate:** design only. No migration, test, runtime or semantic certification is implied by this document.

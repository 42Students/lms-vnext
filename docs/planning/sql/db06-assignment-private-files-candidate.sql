-- W02 DB06 SOURCE-ONLY CANDIDATE. W01 owns registration, snapshot and replay.
-- Maps active legacy assignment_upload_receipt + StudentAssignment FILE_UPLOAD
-- onto private GCS receipts and a one-to-one durable file record.

alter type assignment_submission_type add value if not exists 'FILE';

create table if not exists course_upload_receipts (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references colleges(id) on delete restrict,
  owner_membership_id uuid not null references college_memberships(id) on delete restrict,
  purpose text not null,
  assignment_id uuid null references course_assignments(id) on delete restrict,
  lesson_content_id uuid null references lesson_contents(id) on delete restrict,
  object_key text not null unique,
  upload_token_hash text not null,
  original_name text not null,
  declared_content_type text not null,
  declared_size_bytes integer not null,
  expires_at timestamptz not null,
  attested_generation text null,
  actual_content_type text null,
  actual_size_bytes integer null,
  sha256_hex text null,
  consumed_at timestamptz null,
  consumed_by_submission_id uuid null references assignment_submissions(id) on delete restrict,
  revoked boolean not null default false,
  created_by_user_id uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_upload_receipts_purpose_ck
    check (purpose in ('ASSIGNMENT_SUBMISSION','COURSE_RESOURCE')),
  constraint course_upload_receipts_target_ck
    check (
      (purpose='ASSIGNMENT_SUBMISSION' and assignment_id is not null and lesson_content_id is null)
      or
      (purpose='COURSE_RESOURCE' and lesson_content_id is not null and assignment_id is null)
    ),
  constraint course_upload_receipts_declared_size_ck
    check (declared_size_bytes > 0 and declared_size_bytes <= 52428800),
  constraint course_upload_receipts_attestation_ck
    check (
      (consumed_at is null and consumed_by_submission_id is null)
      or
      (consumed_at is not null and attested_generation is not null
       and actual_content_type is not null and actual_size_bytes is not null
       and sha256_hex is not null)
    )
);
create unique index if not exists course_upload_receipts_submission_uq
  on course_upload_receipts(consumed_by_submission_id)
  where consumed_by_submission_id is not null;
create index if not exists course_upload_receipts_owner_expiry_idx
  on course_upload_receipts(owner_membership_id, expires_at);

create table if not exists assignment_submission_files (
  assignment_submission_id uuid primary key
    references assignment_submissions(id) on delete cascade,
  upload_receipt_id uuid not null unique
    references course_upload_receipts(id) on delete restrict,
  object_key text not null unique,
  object_generation text not null,
  original_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  sha256_hex text not null,
  created_at timestamptz not null default now(),
  constraint assignment_submission_files_size_ck
    check (size_bytes > 0 and size_bytes <= 52428800),
  constraint assignment_submission_files_sha_ck
    check (sha256_hex ~ '^[0-9a-f]{64}$')
);

alter table assignment_submissions
  drop constraint if exists assignment_submissions_payload_ck;
alter table assignment_submissions
  add constraint assignment_submissions_payload_ck check (
    (submission_type='TEXT' and text_content is not null
      and length(trim(text_content)) > 0 and submission_url is null)
    or
    (submission_type='LINK' and submission_url is not null and text_content is null)
    or
    (submission_type='FILE' and text_content is null and submission_url is null)
  );

-- W01 promotion requirements:
-- 1. same-college owner guard: course_upload_receipts.college_id must equal
--    owner membership college and the assignment/lesson's Course college.
-- 2. object_key must match private/<college>/<owner membership>/<namespace>/...
--    purpose ASSIGNMENT_SUBMISSION => namespace assignment-submission;
--    COURSE_RESOURCE => course-resource.
-- 3. deferred constraint trigger at COMMIT:
--    each FILE assignment_submissions row has exactly one
--    assignment_submission_files row, and every file row's parent is FILE.
-- 4. receipt consumption is immutable: once consumed, target/object/owner/
--    attestation fields cannot be changed or cleared by direct SQL.
-- 5. course_upload_receipts upload_token_hash is SHA-256 hex only.
-- 6. course resource material receipt claiming may reuse this receipt table
--    but must bind to the final lesson_content_material id atomically.

-- W02 DB05 SOURCE-ONLY CANDIDATE. W01 must register/replay.
-- Active legacy canonical Resource supports <=20 ordered FILE/LINK materials
-- per lesson Resource, plus notes/html on the parent lesson_content.

create table if not exists lesson_content_materials (
  id uuid primary key default gen_random_uuid(),
  lesson_content_id uuid not null references lesson_contents(id) on delete cascade,
  kind text not null,
  title text not null,
  external_url text null,
  storage_key text null,
  original_name text null,
  mime_type text null,
  size_bytes integer null,
  sequence integer not null,
  created_by_user_id uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_content_materials_kind_ck check (kind in ('LINK','FILE')),
  constraint lesson_content_materials_sequence_ck check (sequence >= 0),
  constraint lesson_content_materials_size_ck check (size_bytes is null or (size_bytes > 0 and size_bytes <= 52428800)),
  constraint lesson_content_materials_shape_ck check (
    (kind='LINK' and external_url is not null and storage_key is null and original_name is null and mime_type is null and size_bytes is null)
    or
    (kind='FILE' and external_url is null and storage_key is not null and original_name is not null and mime_type is not null and size_bytes is not null)
  ),
  constraint lesson_content_materials_content_sequence_uq unique (lesson_content_id, sequence)
);
create unique index if not exists lesson_content_materials_storage_key_uq
  on lesson_content_materials(storage_key) where storage_key is not null;
create index if not exists lesson_content_materials_content_kind_idx
  on lesson_content_materials(lesson_content_id, kind);

-- W01 storage integration requirement: every FILE insert must atomically
-- claim a live uploader receipt for the exact storage key/user/content,
-- and download must never expose storage_key directly to the browser.

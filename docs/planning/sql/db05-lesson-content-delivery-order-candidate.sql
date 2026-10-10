-- W02 DB05 SOURCE-ONLY CANDIDATE. W01 must register/replay.
-- Replaces active legacy lesson_content_class_sequence with exact vNext
-- Course Section Delivery scope.

create table if not exists lesson_content_delivery_sequences (
  lesson_content_id uuid not null
    references lesson_contents(id) on delete cascade,
  delivery_id uuid not null
    references course_section_deliveries(id) on delete cascade,
  sequence integer not null,
  updated_by_user_id uuid not null
    references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_content_delivery_sequences_pk
    primary key (lesson_content_id, delivery_id),
  constraint lesson_content_delivery_sequences_sequence_ck
    check (sequence >= 0)
);
create index if not exists lesson_content_delivery_sequences_delivery_sequence_idx
  on lesson_content_delivery_sequences(delivery_id, sequence);

-- Raw-SQL integrity: an override is valid only when the content belongs to the
-- same Offering as the Delivery and is either shared or authored for that exact
-- Delivery. W01 should implement this as a BEFORE INSERT/UPDATE trigger using:
-- lesson_contents -> course_lessons -> course_learning_paths(offering_id)
-- and course_section_deliveries(offering_id), while requiring
-- lesson_contents.delivery_id is null OR = NEW.delivery_id.

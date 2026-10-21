-- [chat-14] STAGED lesson sequence proposal. Lane 1 must provide composite
-- lesson/content/delivery ownership guards before registration or writes.
CREATE TABLE lesson_content_delivery_sequences (
  lesson_content_id uuid NOT NULL REFERENCES lesson_contents(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL,
  delivery_id uuid NOT NULL REFERENCES course_section_deliveries(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  legacy_class_id bigint,
  legacy_lesson_content_id bigint,
  legacy_sequence bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lesson_content_delivery_sequences_pk PRIMARY KEY(lesson_content_id,delivery_id),
  CONSTRAINT lesson_content_delivery_sequences_sequence_ck CHECK(sequence >= 0),
  CONSTRAINT lesson_content_delivery_sequences_legacy_sequence_ck
    CHECK(legacy_sequence IS NULL OR legacy_sequence >= 0)
);
--> statement-breakpoint
CREATE INDEX lesson_content_delivery_sequences_delivery_sequence_idx
  ON lesson_content_delivery_sequences(delivery_id,sequence);
--> statement-breakpoint
CREATE INDEX lesson_content_delivery_sequences_source_class_idx
  ON lesson_content_delivery_sequences(legacy_class_id,legacy_lesson_content_id);

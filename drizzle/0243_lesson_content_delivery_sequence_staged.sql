-- [chat-14] STAGED lesson sequence proposal. Lane 1 must provide composite
-- lesson/content/delivery ownership guards before registration or writes.
CREATE UNIQUE INDEX IF NOT EXISTS lesson_contents_id_lesson_uq
  ON lesson_contents(id,lesson_id);
--> statement-breakpoint
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
  CONSTRAINT lesson_content_delivery_sequences_content_lesson_fk
    FOREIGN KEY(lesson_content_id,lesson_id)
    REFERENCES lesson_contents(id,lesson_id) ON DELETE CASCADE,
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

--> statement-breakpoint
CREATE UNIQUE INDEX lesson_content_delivery_sequences_order_uq
  ON lesson_content_delivery_sequences(delivery_id,lesson_id,sequence);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION db05_lesson_delivery_order_scope_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE content_offering uuid; delivery_offering uuid;
BEGIN
  SELECT p.offering_id INTO content_offering
    FROM lesson_contents c JOIN course_lessons l ON l.id=c.lesson_id
    JOIN course_learning_paths p ON p.id=l.learning_path_id
   WHERE c.id=NEW.lesson_content_id AND l.id=NEW.lesson_id;
  SELECT d.offering_id INTO delivery_offering
    FROM course_section_deliveries d WHERE d.id=NEW.delivery_id;
  IF content_offering IS NULL OR delivery_offering IS NULL OR content_offering<>delivery_offering THEN
    RAISE EXCEPTION 'lesson delivery sequence violates offering scope' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db05_lesson_delivery_order_scope_before_write
  BEFORE INSERT OR UPDATE ON lesson_content_delivery_sequences
  FOR EACH ROW EXECUTE FUNCTION db05_lesson_delivery_order_scope_guard();

-- [chat-14] Reinforce 0243 draft with a composite delivery/offering
-- witness. Must run only AFTER 0243 is registered/replayed and the DB05
-- offering-scope trigger has passed tenant-negative tests.
-- Lane 15 owns journal registration and release sequencing.
CREATE UNIQUE INDEX IF NOT EXISTS course_section_deliveries_id_offering_uq
 ON course_section_deliveries(id,offering_id);
--> statement-breakpoint
ALTER TABLE lesson_content_delivery_sequences
 ADD COLUMN offering_id uuid;
--> statement-breakpoint
UPDATE lesson_content_delivery_sequences s
 SET offering_id=d.offering_id
 FROM course_section_deliveries d
 WHERE s.delivery_id=d.id;
--> statement-breakpoint
ALTER TABLE lesson_content_delivery_sequences
 ALTER COLUMN offering_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE lesson_content_delivery_sequences
 ADD CONSTRAINT lesson_content_delivery_sequences_delivery_offering_fk
 FOREIGN KEY(delivery_id,offering_id)
 REFERENCES course_section_deliveries(id,offering_id) ON DELETE CASCADE;

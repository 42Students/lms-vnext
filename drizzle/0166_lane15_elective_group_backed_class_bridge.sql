-- Lane 15 elective GROUP_BACKED class-to-delivery bridge. Owner review and migration replay required.
-- The legacy backed_class_id is NOT course_section_deliveries.id; preserve its class roster identity separately.
CREATE UNIQUE INDEX group_backed_offerings_id_group_uq
 ON group_backed_class_offerings (id, roster_group_id);
--> statement-breakpoint
ALTER TABLE elective_offerings ADD COLUMN backed_class_offering_id uuid;
--> statement-breakpoint
ALTER TABLE elective_offerings ADD CONSTRAINT elective_offerings_backed_class_offering_id_fk
 FOREIGN KEY (backed_class_offering_id) REFERENCES group_backed_class_offerings(id) ON DELETE RESTRICT;
--> statement-breakpoint
ALTER TABLE elective_offerings ADD CONSTRAINT elective_offerings_backed_class_group_fk
 FOREIGN KEY (backed_class_offering_id, group_id)
 REFERENCES group_backed_class_offerings (id, roster_group_id) ON DELETE RESTRICT;
--> statement-breakpoint
CREATE UNIQUE INDEX elective_offerings_backed_class_uq
 ON elective_offerings (backed_class_offering_id) WHERE backed_class_offering_id IS NOT NULL;
-- Nullable during additive transition; services must require verified same-period backed class before grade or attendance parity may be declared.

-- TPO-drives-31. Proposed; orchestrator assigns a numbered migration.
-- A record-only outside drive never becomes a published job or an offer.
CREATE UNIQUE INDEX IF NOT EXISTS outside_drives_id_college_uq
 ON placement_outside_drive_records(id,college_id);
CREATE TABLE IF NOT EXISTS placement_outside_drive_participants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 outside_drive_id uuid NOT NULL REFERENCES placement_outside_drive_records(id) ON DELETE RESTRICT,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
 result varchar(20) NOT NULL DEFAULT 'PARTICIPATED',
 updated_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 notes text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT outside_drive_participant_result_ck CHECK
  (result IN ('PARTICIPATED','PASSED','FAILED','SELECTED','HIRED')),
 CONSTRAINT outside_drive_participant_record_college_fk
  FOREIGN KEY(outside_drive_id,college_id) REFERENCES placement_outside_drive_records(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT outside_drive_participant_learner_college_fk
  FOREIGN KEY(membership_id,college_id) REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX IF NOT EXISTS outside_drive_participant_once_uq
 ON placement_outside_drive_participants(outside_drive_id,membership_id);
CREATE INDEX IF NOT EXISTS outside_drive_participant_college_idx
 ON placement_outside_drive_participants(college_id,outside_drive_id);

CREATE TABLE IF NOT EXISTS faculty_avatar_cleanup_queue(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 membership_id uuid NOT NULL REFERENCES college_memberships(id) ON DELETE RESTRICT,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 old_object_key varchar(1024) NOT NULL,
 status varchar(16) NOT NULL DEFAULT 'PENDING',
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz,
 CONSTRAINT faculty_avatar_cleanup_status_ck CHECK(status IN ('PENDING','DONE','FAILED')),
 CONSTRAINT faculty_avatar_cleanup_state_ck CHECK((status='DONE')=(completed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS faculty_avatar_cleanup_pending_idx
 ON faculty_avatar_cleanup_queue(status,created_at);

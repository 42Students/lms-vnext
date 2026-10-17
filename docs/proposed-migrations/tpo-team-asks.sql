-- TPO-inbox-team-22/29/31: draft only. Orchestrator registers the numbered migration.
CREATE TABLE IF NOT EXISTS placement_tpo_team_asks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 thread_id uuid NOT NULL,
 college_id uuid NOT NULL,
 asker_membership_id uuid NOT NULL,
 assignee_membership_id uuid NOT NULL,
 request_key uuid NOT NULL,
 title varchar(200) NOT NULL,
 due_at timestamptz,
 status varchar(12) NOT NULL DEFAULT 'OPEN',
 done_note text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_team_asks_thread_college_fk FOREIGN KEY(thread_id,college_id)
  REFERENCES placement_tpo_internal_threads(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_team_asks_asker_college_fk FOREIGN KEY(asker_membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_team_asks_assignee_college_fk FOREIGN KEY(assignee_membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_team_asks_dedupe_uq UNIQUE(thread_id,asker_membership_id,request_key),
 CONSTRAINT tpo_team_asks_distinct_people_ck CHECK(asker_membership_id <> assignee_membership_id),
 CONSTRAINT tpo_team_asks_status_ck CHECK(status IN ('OPEN','DONE','CANCELLED')),
 CONSTRAINT tpo_team_asks_title_ck CHECK(length(btrim(title)) BETWEEN 1 AND 200),
 CONSTRAINT tpo_team_asks_note_ck CHECK(done_note IS NULL OR length(done_note) <= 2000)
);
CREATE INDEX IF NOT EXISTS tpo_team_asks_assignee_due_idx
 ON placement_tpo_team_asks(college_id,assignee_membership_id,status,due_at);

-- TPO-inbox-team-15: permanent college-level Everyone channel.
-- Proposed only. Orchestrator registers a numbered Drizzle migration.
-- All membership is evaluated from active TPO roles; no invite table.
CREATE TABLE IF NOT EXISTS placement_tpo_team_everyone_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 author_membership_id uuid NOT NULL,
 body text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_team_everyone_messages_author_college_fk
  FOREIGN KEY (author_membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
 CONSTRAINT tpo_team_everyone_message_body_ck CHECK (length(btrim(body)) BETWEEN 1 AND 4000)
);
CREATE INDEX IF NOT EXISTS tpo_team_everyone_messages_college_time_idx
 ON placement_tpo_team_everyone_messages(college_id,created_at);
CREATE TABLE IF NOT EXISTS placement_tpo_team_everyone_mutes (
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 membership_id uuid NOT NULL,
 muted_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_team_everyone_mutes_pk PRIMARY KEY (college_id,membership_id),
 CONSTRAINT tpo_team_everyone_mutes_member_college_fk
  FOREIGN KEY (membership_id,college_id)
  REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT
);
-- Service authorization additionally checks active persisted TPO membership,
-- college scope and placements.manage before all reads/writes.

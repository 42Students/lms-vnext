-- TPO-inbox-team-34: temporary away status for active placement-cell members.
-- The orchestrator registers this; builders do not touch numbered migrations.
CREATE TABLE IF NOT EXISTS placement_tpo_team_away (
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 membership_id uuid NOT NULL,
 away_until timestamptz NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_team_away_pk PRIMARY KEY(college_id,membership_id),
 CONSTRAINT tpo_team_away_membership_college_fk
  FOREIGN KEY(membership_id,college_id) REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS tpo_team_away_until_idx ON placement_tpo_team_away(college_id,away_until);

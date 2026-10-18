-- TPO-companies-05 / TPO-inbox-team-16:
-- PROPOSAL ONLY. This is not a numbered/registered migration. The orchestrator
-- must review foreign keys, deploy it through the official migration ledger,
-- and set storage readiness only when the tables actually exist.
-- Team messages are private to a college/company; never a recruiter conversation.
CREATE TABLE IF NOT EXISTS placement_tpo_company_team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  company_id uuid NOT NULL REFERENCES placement_companies(id) ON DELETE RESTRICT,
  author_membership_id uuid NOT NULL,
  idempotency_key uuid,
  body text NOT NULL,
  decision boolean NOT NULL DEFAULT false,
  ask_assignee_membership_id uuid,
  ask_due_at timestamptz,
  ask_status text,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tpo_company_team_author_college_fk
    FOREIGN KEY (author_membership_id,college_id)
    REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
  CONSTRAINT tpo_company_team_assignee_college_fk
    FOREIGN KEY (ask_assignee_membership_id,college_id)
    REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT,
  CONSTRAINT tpo_company_team_message_body_ck
    CHECK (length(btrim(body)) BETWEEN 1 AND 4000),
  CONSTRAINT tpo_company_team_ask_status_ck
    CHECK (ask_status IS NULL OR ask_status IN ('OPEN','DONE','CANCELLED')),
  CONSTRAINT tpo_company_team_ask_assignee_status_ck
    CHECK ((ask_assignee_membership_id IS NULL AND ask_status IS NULL)
        OR (ask_assignee_membership_id IS NOT NULL AND ask_status IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS tpo_company_team_message_send_dedupe_uq
  ON placement_tpo_company_team_messages(college_id,company_id,author_membership_id,idempotency_key);
CREATE INDEX IF NOT EXISTS tpo_company_team_messages_college_company_time_idx
  ON placement_tpo_company_team_messages(college_id,company_id,created_at);

CREATE TABLE IF NOT EXISTS placement_tpo_company_team_follows (
  college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
  company_id uuid NOT NULL REFERENCES placement_companies(id) ON DELETE RESTRICT,
  membership_id uuid NOT NULL,
  followed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tpo_company_team_follows_pk
    PRIMARY KEY (college_id,company_id,membership_id),
  CONSTRAINT tpo_company_team_follow_member_college_fk
    FOREIGN KEY (membership_id,college_id)
    REFERENCES college_memberships(id,college_id) ON DELETE RESTRICT
);
-- Queries, permissions, team follows, mentions and actor audit stay guarded
-- by src/modules/placements/tpo-company-team-service.ts; do not trust
-- membership_id, college_id or company_id supplied by an unverified browser.

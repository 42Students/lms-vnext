-- TPO-campaigns-public-01/02. STAGED ONLY, register via orchestrator.
-- Existing placement_tpo_email_campaigns has no composer content: do not save
-- an empty placeholder campaign that cannot be reconstructed.
CREATE TABLE placement_tpo_campaign_drafts (
 campaign_id uuid PRIMARY KEY,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 title varchar(160) NOT NULL,
 subject varchar(200) NOT NULL,
 body text NOT NULL CHECK(length(trim(body)) BETWEEN 2 AND 10000),
 sender_name varchar(200) NOT NULL,
 suppressed_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
 template_key varchar(160) NOT NULL,
 segment varchar(24) NOT NULL CHECK(segment IN ('ALL_ELIGIBLE','NEW','UNASSIGNED')),
 created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT tpo_campaign_draft_campaign_scope_fk
 FOREIGN KEY (college_id,campaign_id)
 REFERENCES placement_tpo_email_campaigns(college_id,id) ON DELETE RESTRICT
);
-- All sends must re-read live suppression, grant, college, and recipient
-- allowlist within the shared messaging module and persist provider receipts.

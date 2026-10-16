-- TPO-campaigns-public-01/02 follow-up (chat-2). Table placement_tpo_campaign_drafts
-- is already registered (0103, body CHECK 2..4000). The composer now also persists
-- sender_name and suppressed_counts and allows bodies up to 10000 characters.
ALTER TABLE placement_tpo_campaign_drafts ADD COLUMN sender_name varchar(200);
UPDATE placement_tpo_campaign_drafts SET sender_name='Placement cell' WHERE sender_name IS NULL;
ALTER TABLE placement_tpo_campaign_drafts ALTER COLUMN sender_name SET NOT NULL;
ALTER TABLE placement_tpo_campaign_drafts ADD COLUMN suppressed_counts jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE placement_tpo_campaign_drafts DROP CONSTRAINT tpo_campaign_draft_body_ck;
ALTER TABLE placement_tpo_campaign_drafts ADD CONSTRAINT tpo_campaign_draft_body_ck
 CHECK (length(trim(body)) BETWEEN 2 AND 10000);

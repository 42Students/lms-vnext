-- Proposal: orchestrator must register/replay before TPO_CAMPAIGNS_READY=VERIFIED.
-- TPO-campaigns-public-01/02: legacy 10,000-character campaign text and saved suppression summary.
ALTER TABLE placement_tpo_campaign_drafts
  DROP CONSTRAINT IF EXISTS tpo_campaign_draft_body_ck;
ALTER TABLE placement_tpo_campaign_drafts
  ADD CONSTRAINT tpo_campaign_draft_body_ck
  CHECK (length(trim(body)) BETWEEN 2 AND 10000);
ALTER TABLE placement_tpo_campaign_drafts
  ADD COLUMN IF NOT EXISTS suppression_counts jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE placement_tpo_campaign_drafts
  ADD CONSTRAINT tpo_campaign_draft_suppression_counts_ck
  CHECK(jsonb_typeof(suppression_counts)='object');
-- Do not persist raw recipient addresses or bearer unsubscribe tokens.
-- Delivery stays gated until the registered migration, dedicated ZeptoMail
-- campaign template, signed unsubscribe link, quota and receipts are verified.

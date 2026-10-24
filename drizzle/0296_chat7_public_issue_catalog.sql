-- [chat-7] Public tracker discovery is explicitly opt-in per report.
-- Null is private by default. Never expose description, reporter or attachments.
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS public_catalog_approved_at timestamptz;
CREATE INDEX IF NOT EXISTS bug_reports_public_catalog_idx
 ON bug_reports (public_catalog_approved_at DESC, id DESC)
 WHERE public_catalog_approved_at IS NOT NULL
   AND production_verified = true AND status = 'CLOSED';

-- [chat-14] Preserve legacy four-way per-college login channel preference.
-- This does not enable auth enforcement: the verified tenant-host login handler
-- must read the authoritative college policy and keep global identity generic.
ALTER TABLE college_branding
  ADD COLUMN IF NOT EXISTS login_methods varchar(16) NOT NULL DEFAULT 'EMAIL_PHONE';
--> statement-breakpoint
ALTER TABLE college_branding
  ADD CONSTRAINT college_branding_login_methods_ck
    CHECK (login_methods IN ('EMAIL_PHONE','PHONE_EMAIL','EMAIL_ONLY','PHONE_ONLY'));

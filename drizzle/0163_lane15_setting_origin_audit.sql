-- Track origin separately from latest editor. Legacy non-GLOBAL/COLLEGE
-- scopes are NOT silently made active; they require an approved policy resolver.
ALTER TABLE platform_setting_overrides
  ADD COLUMN created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN created_by_user_id uuid REFERENCES users(id) ON DELETE RESTRICT;

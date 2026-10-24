-- Mentor Google Calendar OAuth grants. Tokens are stored as authenticated
-- AES-256-GCM ciphertext by the application, scoped to one user and college.
-- No provider credential or event is copied into the client.
CREATE TABLE IF NOT EXISTS mentor_google_calendar_connections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 college_id uuid NOT NULL REFERENCES colleges(id) ON DELETE RESTRICT,
 refresh_token_ciphertext text,
 scope text NOT NULL,
 calendar_id varchar(254) NOT NULL DEFAULT 'primary',
 connected_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 revoked_at timestamptz,
 CONSTRAINT mentor_google_calendar_connections_token_state_ck
 CHECK (revoked_at IS NOT NULL OR refresh_token_ciphertext IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS mentor_google_calendar_connections_owner_uq
 ON mentor_google_calendar_connections(user_id,college_id);

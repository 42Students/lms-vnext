-- PROPOSED ONLY. Owner approves DB migration + central publication and delivery service.
-- Intentionally no active sender, webhook, notification fan-out or unregistered drizzle modifications.
CREATE TABLE platform_broadcasts(
 id uuid PRIMARY KEY,
 title varchar(255) NOT NULL,
 message text NOT NULL,
 link_url varchar(2048) NULL,
 is_pinned boolean NOT NULL DEFAULT false,
 show_until timestamptz NOT NULL,
 audience_mode varchar(24) NOT NULL CHECK(audience_mode IN('ALL_COLLEGES','SELECTED_COLLEGES')),
 status varchar(16) NOT NULL CHECK(status IN('DRAFT','PUBLISHED','CANCELLED')),
 author_user_id uuid NOT NULL REFERENCES users(id),
 version integer NOT NULL DEFAULT 0 CHECK(version>=0),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE platform_broadcast_targets(
 broadcast_id uuid NOT NULL REFERENCES platform_broadcasts(id) ON DELETE CASCADE,
 college_id uuid NOT NULL REFERENCES colleges(id),
 PRIMARY KEY(broadcast_id,college_id)
);
CREATE INDEX platform_broadcasts_created_at ON platform_broadcasts(created_at);
-- At publish time transactionally resolve all current authorized colleges:
-- ALL_COLLEGES must have no explicit target rows; SELECTED_COLLEGES requires
-- at least one valid college target. Authorize old/new audience at every edit.
-- The owner must establish idempotent delivery intents and privacy rules.

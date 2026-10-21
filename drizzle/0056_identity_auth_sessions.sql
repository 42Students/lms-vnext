-- Legacy auth retirement crosswalk; historical tokens/sessions are NOT
-- imported. The owner explicitly chose greenfield vNext, no data migration.
-- auth_token: id -> no alias; created_at/updated_at -> audit-only provenance
-- (not copied); is_deleted -> expired token state (retired); token -> NEVER
-- copied, cached, or stored in plaintext.
-- auth_handoff_token: raw access/refresh tokens -> retired; all integrations
-- require a fresh authenticated handoff, not a token replay.
-- email_verification_token (7 fields):
-- token -> keyed one-way digest; application_id -> scoped UUID application;
-- created_at -> timezone-reviewed instant; email -> keyed email fingerprint;
-- expires_at -> independent 24h link expiry (NOT 5-minute sign-in OTP);
-- verified -> durable ownership state; verified_at -> ownership timestamp.
-- Identity ownership links and proofs are separately schema-managed, never
-- silently aliased to an identity_auth_attempts login challenge.
-- mobile_login_attempt: numeric id/user_id and role -> UUID user/membership
-- + bounded target_role; nullable old organization/college -> persisted college
-- relationship; raw phone/email OTP -> keyed MAC; contact -> HMAC fingerprint;
-- used -> used_at; attempts -> verification_attempts; blocked_until and
-- resend lock -> explicit challenge state; lastUpdated -> version + timestamps.
-- user_session: jti -> credential_digest (never raw JTI); numeric user_id ->
-- users UUID by explicit crosswalk; user_type -> resolved memberships/roles,
-- device_name -> device_name, user_agent -> user_agent, ip_address -> masked
-- transport metadata, created_at -> created_at, last_used_at -> last_seen_at,
-- expires_at -> expires_at. Revoked sessions are not imported as active.
-- login_user numeric IDs/password hashes are retired; users authenticate
-- through fresh registration and current identity service. Source MySQL local
-- timestamps must not be cast directly to PostgreSQL timestamptz.
-- No old row is made active merely to satisfy a foreign key; any future import
-- must validate target identity, consent, timezone, source consumers and
-- owner-approved revocation before enabling a producer.
--
CREATE TABLE "identity_auth_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"college_id" uuid,
	"membership_id" uuid,
	"target_role" varchar(24) NOT NULL,
	"contact_fingerprint" varchar(64) NOT NULL,
	"sms_code_mac" varchar(64),
	"sms_code_expires_at" timestamp with time zone,
	"email_code_mac" varchar(64),
	"email_code_expires_at" timestamp with time zone,
	"email_code_sent_at" timestamp with time zone,
	"verification_attempts" integer DEFAULT 0 NOT NULL,
	"resend_attempts" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"used_at" timestamp with time zone,
	CONSTRAINT "identity_auth_attempts_membership_college_shape_ck" CHECK ("identity_auth_attempts"."membership_id" IS NULL OR "identity_auth_attempts"."college_id" IS NOT NULL),
	CONSTRAINT "identity_auth_attempts_expiry_ck" CHECK ("identity_auth_attempts"."expires_at" > "identity_auth_attempts"."created_at"),
	CONSTRAINT "identity_auth_attempts_attempt_bounds_ck" CHECK ("identity_auth_attempts"."verification_attempts" BETWEEN 0 AND 5 AND "identity_auth_attempts"."resend_attempts" >= 0),
	CONSTRAINT "identity_auth_attempts_version_ck" CHECK ("identity_auth_attempts"."version" >= 1),
	CONSTRAINT "identity_auth_attempts_sms_shape_ck" CHECK (("identity_auth_attempts"."sms_code_mac" IS NULL) = ("identity_auth_attempts"."sms_code_expires_at" IS NULL)),
	CONSTRAINT "identity_auth_attempts_email_shape_ck" CHECK (("identity_auth_attempts"."email_code_mac" IS NULL) = ("identity_auth_attempts"."email_code_expires_at" IS NULL)),
	CONSTRAINT "identity_auth_attempts_mac_shape_ck" CHECK (("identity_auth_attempts"."sms_code_mac" IS NULL OR "identity_auth_attempts"."sms_code_mac" ~ '^[0-9a-f]{64}$') AND
          ("identity_auth_attempts"."email_code_mac" IS NULL OR "identity_auth_attempts"."email_code_mac" ~ '^[0-9a-f]{64}$') AND
          "identity_auth_attempts"."contact_fingerprint" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "identity_auth_attempts_timestamp_ck" CHECK (("identity_auth_attempts"."verified_at" IS NULL OR ("identity_auth_attempts"."verified_at" >= "identity_auth_attempts"."created_at" AND "identity_auth_attempts"."verified_at" < "identity_auth_attempts"."expires_at")) AND
          ("identity_auth_attempts"."used_at" IS NULL OR ("identity_auth_attempts"."used_at" >= "identity_auth_attempts"."created_at" AND "identity_auth_attempts"."used_at" < "identity_auth_attempts"."expires_at"))),
	CONSTRAINT "identity_auth_attempts_five_minute_expiry_ck" CHECK ("identity_auth_attempts"."expires_at" <= "identity_auth_attempts"."created_at" + interval '5 minutes'),
	CONSTRAINT "identity_auth_attempts_target_role_shape_ck" CHECK (char_length(btrim("identity_auth_attempts"."target_role")) BETWEEN 1 AND 24),
	CONSTRAINT "identity_auth_attempts_consumed_shape_ck" CHECK ("identity_auth_attempts"."used_at" IS NULL OR
          ("identity_auth_attempts"."verified_at" IS NOT NULL
           AND "identity_auth_attempts"."verified_at" <= "identity_auth_attempts"."used_at"
           AND "identity_auth_attempts"."sms_code_mac" IS NULL
           AND "identity_auth_attempts"."sms_code_expires_at" IS NULL
           AND "identity_auth_attempts"."email_code_mac" IS NULL
           AND "identity_auth_attempts"."email_code_expires_at" IS NULL))
);--> statement-breakpoint
CREATE TABLE "identity_device_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_digest" varchar(64) NOT NULL,
	"device_name" varchar(255),
	"user_agent" varchar(512),
	"ip_address" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by_user_id" uuid,
	"revocation_reason" text,
	CONSTRAINT "identity_device_sessions_digest_format_ck" CHECK ("identity_device_sessions"."credential_digest" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "identity_device_sessions_expiry_ck" CHECK ("identity_device_sessions"."expires_at" > "identity_device_sessions"."created_at"),
	CONSTRAINT "identity_device_sessions_last_seen_ck" CHECK ("identity_device_sessions"."last_seen_at" >= "identity_device_sessions"."created_at"),
	CONSTRAINT "identity_device_sessions_revoked_time_ck" CHECK ("identity_device_sessions"."revoked_at" is null or "identity_device_sessions"."revoked_at" >= "identity_device_sessions"."created_at"),
	CONSTRAINT "identity_device_sessions_revoker_shape_ck" CHECK (("identity_device_sessions"."revoked_at" is null) = ("identity_device_sessions"."revoked_by_user_id" is null))
);--> statement-breakpoint
CREATE UNIQUE INDEX "college_memberships_id_user_college_uq" ON "college_memberships" USING btree ("id","user_id","college_id");--> statement-breakpoint
ALTER TABLE "identity_auth_attempts" ADD CONSTRAINT "identity_auth_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_auth_attempts" ADD CONSTRAINT "identity_auth_attempts_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_auth_attempts" ADD CONSTRAINT "identity_auth_attempts_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_auth_attempts" ADD CONSTRAINT "identity_auth_attempts_membership_scope_fk" FOREIGN KEY ("membership_id","user_id","college_id") REFERENCES "public"."college_memberships"("id","user_id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_device_sessions" ADD CONSTRAINT "identity_device_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_device_sessions" ADD CONSTRAINT "identity_device_sessions_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "identity_auth_attempts_user_expiry_idx" ON "identity_auth_attempts" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "identity_auth_attempts_contact_rate_idx" ON "identity_auth_attempts" USING btree ("contact_fingerprint","created_at");--> statement-breakpoint
CREATE INDEX "identity_auth_attempts_expiry_idx" ON "identity_auth_attempts" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "identity_device_sessions_digest_uq" ON "identity_device_sessions" USING btree ("credential_digest");--> statement-breakpoint
CREATE INDEX "identity_device_sessions_user_time_idx" ON "identity_device_sessions" USING btree ("user_id","last_seen_at");--> statement-breakpoint
CREATE INDEX "identity_device_sessions_expiry_idx" ON "identity_device_sessions" USING btree ("expires_at");

-- Before an approved historic import, group nullable-global source rows by
-- normalized (scope,key), choosing highest updated_at and source numeric ID.
-- NULL/empty only maps to GLOBAL/GLOBAL with no conflicting org context.
-- Equal sort keys with different values require manual resolution. Values
-- longer than varchar limits are rejected instead of silently truncated.
CREATE TABLE "platform_setting_overrides" (
	"scope_type" varchar(8) NOT NULL,
	"scope_id" varchar(40) NOT NULL,
	"key" varchar(120) NOT NULL,
	"value" varchar(4096) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_setting_overrides_scope_type_scope_id_key_pk" PRIMARY KEY("scope_type","scope_id","key"),
	CONSTRAINT "platform_override_scope_ck" CHECK (("platform_setting_overrides"."scope_type"='GLOBAL' and "platform_setting_overrides"."scope_id"='GLOBAL') or ("platform_setting_overrides"."scope_type"='COLLEGE' and "platform_setting_overrides"."scope_id" ~ '^[0-9a-f-]{36}$')),
	CONSTRAINT "platform_override_version_ck" CHECK ("platform_setting_overrides"."version">=1)
);
--> statement-breakpoint
ALTER TABLE "platform_setting_overrides" ADD CONSTRAINT "platform_setting_overrides_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
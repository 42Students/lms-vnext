CREATE TABLE "college_branding" (
	"college_id" uuid PRIMARY KEY NOT NULL,
	"logo_url" text,
	"favicon_url" text,
	"login_background_url" text,
	"login_background_url_mobile" text,
	"login_methods" varchar(32),
	"primary_color" varchar(7),
	"secondary_color" varchar(7),
	"support_email" varchar(320),
	"support_phone" varchar(32),
	"terms_url" text,
	"privacy_url" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "college_branding_login_methods_ck" CHECK ("login_methods" IS NULL OR "login_methods" IN ('EMAIL_PHONE','PHONE_EMAIL','EMAIL_ONLY','PHONE_ONLY')),
	CONSTRAINT "college_branding_version_ck" CHECK ("college_branding"."version" >= 1),
	CONSTRAINT "college_branding_logo_url_ck" CHECK ("logo_url" IS NULL OR ("logo_url" ~ '^https://[^[:space:]]+$' AND char_length("logo_url") <= 2048)),
	CONSTRAINT "college_branding_favicon_url_ck" CHECK ("favicon_url" IS NULL OR ("favicon_url" ~ '^https://[^[:space:]]+$' AND char_length("favicon_url") <= 2048)),
	CONSTRAINT "college_branding_login_bg_url_ck" CHECK ("login_background_url" IS NULL OR ("login_background_url" ~ '^https://[^[:space:]]+$' AND char_length("login_background_url") <= 2048)),
	CONSTRAINT "college_branding_login_bg_mobile_url_ck" CHECK ("login_background_url_mobile" IS NULL OR ("login_background_url_mobile" ~ '^https://[^[:space:]]+$' AND char_length("login_background_url_mobile") <= 2048)),
	CONSTRAINT "college_branding_terms_url_ck" CHECK ("terms_url" IS NULL OR ("terms_url" ~ '^https://[^[:space:]]+$' AND char_length("terms_url") <= 2048)),
	CONSTRAINT "college_branding_privacy_url_ck" CHECK ("privacy_url" IS NULL OR ("privacy_url" ~ '^https://[^[:space:]]+$' AND char_length("privacy_url") <= 2048)),
	CONSTRAINT "college_branding_primary_color_ck" CHECK ("primary_color" IS NULL OR "primary_color" ~ '^#[0-9A-Fa-f]{6}$'),
	CONSTRAINT "college_branding_secondary_color_ck" CHECK ("secondary_color" IS NULL OR "secondary_color" ~ '^#[0-9A-Fa-f]{6}$')
);
--> statement-breakpoint
ALTER TABLE "college_branding" ADD CONSTRAINT "college_branding_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
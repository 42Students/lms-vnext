-- W01 / DB-002 structural registration of canonical DB09 policy + CRM tables.
-- Exact structural sources:
--   src/db/schema/tpo-policy.ts
--   src/db/schema/tpo-crm.ts
--
-- This migration intentionally registers canonical Drizzle structure only.
-- Stronger DB09 principal/lifecycle/append-only trigger drafts remain DB-017
-- integration work and are NOT claimed executed or verified here.

CREATE TABLE "placement_college_rules" (
  "college_id" uuid PRIMARY KEY NOT NULL,
  "counts_as_placed_at" varchar(20) DEFAULT 'OFFER_RELEASED' NOT NULL,
  "max_held_offers" integer DEFAULT 1 NOT NULL,
  "uplift_pct" integer DEFAULT 40 NOT NULL,
  "min_response_hours" integer DEFAULT 48 NOT NULL,
  "version" bigint DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_college_rules_counts_at_ck"
    CHECK ("placement_college_rules"."counts_as_placed_at" in ('SELECTED', 'OFFER_RELEASED', 'OFFER_ACCEPTED')),
  CONSTRAINT "placement_college_rules_bounds_ck"
    CHECK ("placement_college_rules"."max_held_offers" >= 1 and "placement_college_rules"."uplift_pct" >= 0 and "placement_college_rules"."min_response_hours" >= 1 and "placement_college_rules"."version" >= 0)
);
--> statement-breakpoint
ALTER TABLE "placement_college_rules"
  ADD CONSTRAINT "placement_college_rules_college_id_colleges_id_fk"
  FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE "placement_company_visibility_settings" (
  "college_id" uuid PRIMARY KEY NOT NULL,
  "show_cgpa_exact" boolean DEFAULT false NOT NULL,
  "show_tenth_twelfth" boolean DEFAULT true NOT NULL,
  "show_project_links" boolean DEFAULT true NOT NULL,
  "show_assessment_scores" boolean DEFAULT false NOT NULL,
  "show_attendance" boolean DEFAULT false NOT NULL,
  "version" bigint DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_company_visibility_version_ck"
    CHECK ("placement_company_visibility_settings"."version" >= 0)
);
--> statement-breakpoint
ALTER TABLE "placement_company_visibility_settings"
  ADD CONSTRAINT "placement_company_visibility_settings_college_id_colleges_id_fk"
  FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

CREATE TABLE "placement_tpo_leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "college_id" uuid NOT NULL,
  "company_relationship_id" uuid,
  "name" varchar(150) NOT NULL,
  "designation" varchar(100),
  "email_norm" varchar(150),
  "phone_norm" varchar(20),
  "company_name" varchar(150),
  "company_logo_object_path" text,
  "owner_membership_id" uuid,
  "manual_stage" varchar(15) DEFAULT 'NEW' NOT NULL,
  "not_now_reason" varchar(255),
  "not_now_until" date,
  "source" varchar(30),
  "invite_token_hash" varchar(128),
  "invite_sent_at" timestamp with time zone,
  "invite_clicked_at" timestamp with time zone,
  "invite_reminder_sent_at" timestamp with time zone,
  "invite_bounced_at" timestamp with time zone,
  "unsubscribed_at" timestamp with time zone,
  "recruiter_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_tpo_leads_stage_ck"
    CHECK ("placement_tpo_leads"."manual_stage" in ('NEW', 'CONTACTED', 'NOT_NOW')),
  CONSTRAINT "placement_tpo_leads_contact_ck"
    CHECK ("placement_tpo_leads"."email_norm" is not null or "placement_tpo_leads"."phone_norm" is not null),
  CONSTRAINT "placement_tpo_leads_name_ck"
    CHECK (length(trim("placement_tpo_leads"."name")) > 0),
  CONSTRAINT "placement_tpo_leads_email_lower_ck"
    CHECK ("placement_tpo_leads"."email_norm" is null or "placement_tpo_leads"."email_norm" = lower("placement_tpo_leads"."email_norm")),
  CONSTRAINT "placement_tpo_leads_phone_digits_ck"
    CHECK ("placement_tpo_leads"."phone_norm" is null or "placement_tpo_leads"."phone_norm" ~ '^[0-9]{7,20}$'),
  CONSTRAINT "placement_tpo_leads_invite_hash_ck"
    CHECK ("placement_tpo_leads"."invite_token_hash" is null or "placement_tpo_leads"."invite_token_hash" ~ '^[a-f0-9]{64}$'),
  CONSTRAINT "placement_tpo_leads_invite_lifecycle_ck"
    CHECK (("placement_tpo_leads"."invite_token_hash" is null or "placement_tpo_leads"."invite_sent_at" is not null)
      and ("placement_tpo_leads"."invite_clicked_at" is null or ("placement_tpo_leads"."invite_sent_at" is not null and "placement_tpo_leads"."invite_clicked_at" >= "placement_tpo_leads"."invite_sent_at"))
      and ("placement_tpo_leads"."invite_reminder_sent_at" is null or ("placement_tpo_leads"."invite_sent_at" is not null and "placement_tpo_leads"."invite_reminder_sent_at" >= "placement_tpo_leads"."invite_sent_at"))
      and ("placement_tpo_leads"."invite_bounced_at" is null or ("placement_tpo_leads"."invite_sent_at" is not null and "placement_tpo_leads"."invite_bounced_at" >= "placement_tpo_leads"."invite_sent_at"))
      and ("placement_tpo_leads"."unsubscribed_at" is null or "placement_tpo_leads"."invite_token_hash" is null))
);
--> statement-breakpoint
ALTER TABLE "placement_tpo_leads"
  ADD CONSTRAINT "placement_tpo_leads_college_id_colleges_id_fk"
  FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_tpo_leads"
  ADD CONSTRAINT "placement_tpo_leads_company_relationship_id_placement_company_relationships_id_fk"
  FOREIGN KEY ("company_relationship_id") REFERENCES "public"."placement_company_relationships"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_tpo_leads"
  ADD CONSTRAINT "placement_tpo_leads_owner_membership_id_college_memberships_id_fk"
  FOREIGN KEY ("owner_membership_id") REFERENCES "public"."college_memberships"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_tpo_leads"
  ADD CONSTRAINT "placement_tpo_leads_recruiter_user_id_users_id_fk"
  FOREIGN KEY ("recruiter_user_id") REFERENCES "public"."users"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_leads_college_id_id_uq"
  ON "placement_tpo_leads" USING btree ("college_id","id");
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_leads_college_email_uq"
  ON "placement_tpo_leads" USING btree ("college_id","email_norm")
  WHERE "placement_tpo_leads"."email_norm" is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_leads_college_phone_uq"
  ON "placement_tpo_leads" USING btree ("college_id","phone_norm")
  WHERE "placement_tpo_leads"."phone_norm" is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_leads_invite_hash_uq"
  ON "placement_tpo_leads" USING btree ("invite_token_hash")
  WHERE "placement_tpo_leads"."invite_token_hash" is not null;
--> statement-breakpoint
CREATE INDEX "placement_tpo_leads_college_stage_updated_idx"
  ON "placement_tpo_leads" USING btree ("college_id","manual_stage","updated_at");
--> statement-breakpoint
CREATE INDEX "placement_tpo_leads_owner_idx"
  ON "placement_tpo_leads" USING btree ("owner_membership_id","updated_at");
--> statement-breakpoint

CREATE TABLE "placement_tpo_lead_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "college_id" uuid NOT NULL,
  "lead_id" uuid NOT NULL,
  "type" varchar(20) NOT NULL,
  "outcome" varchar(30),
  "note" varchar(2000),
  "is_system" boolean DEFAULT false NOT NULL,
  "created_by_user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_tpo_lead_activities_type_ck"
    CHECK ("placement_tpo_lead_activities"."type" in ('CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'NOTE', 'SYSTEM')),
  CONSTRAINT "placement_tpo_lead_activities_system_ck"
    CHECK (("placement_tpo_lead_activities"."type" = 'SYSTEM') = "placement_tpo_lead_activities"."is_system")
);
--> statement-breakpoint
ALTER TABLE "placement_tpo_lead_activities"
  ADD CONSTRAINT "placement_tpo_lead_activities_college_id_colleges_id_fk"
  FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_tpo_lead_activities"
  ADD CONSTRAINT "placement_tpo_lead_activities_created_by_user_id_users_id_fk"
  FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_tpo_lead_activities"
  ADD CONSTRAINT "placement_tpo_lead_activities_scoped_fk"
  FOREIGN KEY ("college_id","lead_id")
  REFERENCES "public"."placement_tpo_leads"("college_id","id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "placement_tpo_lead_activities_lead_time_idx"
  ON "placement_tpo_lead_activities" USING btree ("college_id","lead_id","created_at");
--> statement-breakpoint

CREATE TABLE "placement_tpo_followups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "college_id" uuid NOT NULL,
  "lead_id" uuid NOT NULL,
  "due_at" timestamp with time zone NOT NULL,
  "owner_membership_id" uuid,
  "note" varchar(500),
  "done_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_tpo_followups_done_time_ck"
    CHECK ("placement_tpo_followups"."done_at" is null or "placement_tpo_followups"."done_at" >= "placement_tpo_followups"."created_at")
);
--> statement-breakpoint
ALTER TABLE "placement_tpo_followups"
  ADD CONSTRAINT "placement_tpo_followups_college_id_colleges_id_fk"
  FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_tpo_followups"
  ADD CONSTRAINT "placement_tpo_followups_owner_membership_id_college_memberships_id_fk"
  FOREIGN KEY ("owner_membership_id") REFERENCES "public"."college_memberships"("id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_tpo_followups"
  ADD CONSTRAINT "placement_tpo_followups_scoped_fk"
  FOREIGN KEY ("college_id","lead_id")
  REFERENCES "public"."placement_tpo_leads"("college_id","id")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "placement_tpo_followups_college_due_idx"
  ON "placement_tpo_followups" USING btree ("college_id","done_at","due_at");
--> statement-breakpoint
CREATE INDEX "placement_tpo_followups_lead_idx"
  ON "placement_tpo_followups" USING btree ("college_id","lead_id");

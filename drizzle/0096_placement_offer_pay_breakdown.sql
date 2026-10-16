ALTER TABLE "placement_job_role_options" ADD COLUMN "fixed_lpa" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "placement_job_role_options" ADD COLUMN "variable_lpa" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "placement_job_role_options" ADD COLUMN "joining_bonus_lpa" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "placement_job_role_options" ADD COLUMN "bond_months" integer;--> statement-breakpoint
ALTER TABLE "placement_job_role_options" ADD COLUMN "bond_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "placement_offers" ADD COLUMN "fixed_lpa" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "placement_offers" ADD COLUMN "variable_lpa" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "placement_offers" ADD COLUMN "joining_bonus_lpa" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "placement_offers" ADD COLUMN "bond_months" integer;--> statement-breakpoint
ALTER TABLE "placement_offers" ADD COLUMN "bond_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "placement_offers" ADD COLUMN "acceptance_channel" varchar(24);--> statement-breakpoint
ALTER TABLE "placement_offers" ADD COLUMN "accepted_disputable_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "placement_offers" ADD COLUMN "cascade_id" uuid;--> statement-breakpoint
ALTER TABLE "placement_offers" ADD COLUMN "revoke_reason" varchar(500);--> statement-breakpoint
CREATE INDEX "placement_offers_cascade_id_idx" ON "placement_offers" USING btree ("cascade_id") WHERE "placement_offers"."cascade_id" is not null;--> statement-breakpoint
ALTER TABLE "placement_job_role_options" ADD CONSTRAINT "placement_job_role_options_pay_breakdown_ck" CHECK (("placement_job_role_options"."fixed_lpa" is null or "placement_job_role_options"."fixed_lpa" >= 0)
        and ("placement_job_role_options"."variable_lpa" is null or "placement_job_role_options"."variable_lpa" >= 0)
        and ("placement_job_role_options"."joining_bonus_lpa" is null or "placement_job_role_options"."joining_bonus_lpa" >= 0)
        and ("placement_job_role_options"."bond_months" is null or "placement_job_role_options"."bond_months" between 0 and 120)
        and ("placement_job_role_options"."bond_amount" is null or "placement_job_role_options"."bond_amount" >= 0));--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_pay_breakdown_ck" CHECK (("placement_offers"."fixed_lpa" is null or "placement_offers"."fixed_lpa" >= 0)
        and ("placement_offers"."variable_lpa" is null or "placement_offers"."variable_lpa" >= 0)
        and ("placement_offers"."joining_bonus_lpa" is null or "placement_offers"."joining_bonus_lpa" >= 0)
        and ("placement_offers"."bond_months" is null or "placement_offers"."bond_months" between 0 and 120)
        and ("placement_offers"."bond_amount" is null or "placement_offers"."bond_amount" >= 0));--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_acceptance_channel_ck" CHECK ("placement_offers"."acceptance_channel" is null or "placement_offers"."acceptance_channel" in ('IN_APP', 'EXTERNAL_IMPORT'));--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_revoke_reason_ck" CHECK ("placement_offers"."revoke_reason" is null or length(trim("placement_offers"."revoke_reason")) > 0);
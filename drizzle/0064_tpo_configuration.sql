CREATE TABLE "placement_tpo_after_college" (
	"learner_membership_id" uuid PRIMARY KEY NOT NULL,
	"college_id" uuid NOT NULL,
	"outcome" varchar(40) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_after_college_outcome_ck" CHECK ("placement_tpo_after_college"."outcome" in ('HIGHER_STUDIES','ENTREPRENEURSHIP','COMPETITIVE_EXAMS','LOOKING_FOR_JOB','NOT_DECIDED'))
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_blocked_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"day" date NOT NULL,
	"reason" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_blocked_dates_reason_ck" CHECK (length(btrim("placement_tpo_blocked_dates"."reason")) > 0)
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_job_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"label" varchar(100) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_job_types_label_ck" CHECK (length(btrim("placement_tpo_job_types"."label")) > 0)
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_prep_readiness" (
	"college_id" uuid PRIMARY KEY NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_prep_readiness_object_ck" CHECK (jsonb_typeof("placement_tpo_prep_readiness"."config") = 'object')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "college_memberships_id_college_uq" ON "college_memberships" USING btree ("id","college_id");
--> statement-breakpoint
ALTER TABLE "placement_tpo_after_college" ADD CONSTRAINT "placement_tpo_after_college_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_after_college" ADD CONSTRAINT "placement_tpo_after_college_membership_college_fk" FOREIGN KEY ("learner_membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_blocked_dates" ADD CONSTRAINT "placement_tpo_blocked_dates_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_job_types" ADD CONSTRAINT "placement_tpo_job_types_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_prep_readiness" ADD CONSTRAINT "placement_tpo_prep_readiness_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_blocked_dates_college_day_uq" ON "placement_tpo_blocked_dates" USING btree ("college_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_job_types_college_label_uq" ON "placement_tpo_job_types" USING btree ("college_id","label");
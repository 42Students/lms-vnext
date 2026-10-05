CREATE TABLE "module_access_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope_type" varchar(32) NOT NULL,
	"scope_id" uuid,
	"module" varchar(32) NOT NULL,
	"enabled" boolean NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "module_access_rules_scope_type_ck" CHECK ("module_access_rules"."scope_type" in ('MEMBERSHIP', 'SECTION', 'COHORT', 'PROGRAM', 'DEPARTMENT', 'COLLEGE', 'ORGANIZATION', 'GLOBAL')),
	CONSTRAINT "module_access_rules_module_ck" CHECK ("module_access_rules"."module" in ('projects', 'placements', 'electives')),
	CONSTRAINT "module_access_rules_global_shape_ck" CHECK (("module_access_rules"."scope_type" = 'GLOBAL' and "module_access_rules"."scope_id" is null)
        or ("module_access_rules"."scope_type" <> 'GLOBAL' and "module_access_rules"."scope_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "placement_eligibility_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"scope_type" varchar(24) NOT NULL,
	"scope_id" uuid NOT NULL,
	"status" varchar(24) NOT NULL,
	"reason" text,
	"note" text,
	"decided_by_user_id" uuid,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_eligibility_decisions_scope_ck" CHECK ("placement_eligibility_decisions"."scope_type" in ('MEMBERSHIP', 'SECTION', 'COHORT')),
	CONSTRAINT "placement_eligibility_decisions_status_ck" CHECK ("placement_eligibility_decisions"."status" in ('ELIGIBLE', 'INELIGIBLE')),
	CONSTRAINT "placement_eligibility_decisions_reason_ck" CHECK ("placement_eligibility_decisions"."status" = 'ELIGIBLE' or length(trim(coalesce("placement_eligibility_decisions"."reason", ''))) > 0)
);
--> statement-breakpoint
ALTER TABLE "module_access_rules" ADD CONSTRAINT "module_access_rules_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_eligibility_decisions" ADD CONSTRAINT "placement_eligibility_decisions_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_eligibility_decisions" ADD CONSTRAINT "placement_eligibility_decisions_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "module_access_rules_scoped_uq" ON "module_access_rules" USING btree ("scope_type","scope_id","module") WHERE "module_access_rules"."scope_id" is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX "module_access_rules_global_uq" ON "module_access_rules" USING btree ("scope_type","module") WHERE "module_access_rules"."scope_id" is null;
--> statement-breakpoint
CREATE INDEX "module_access_rules_module_idx" ON "module_access_rules" USING btree ("module","enabled");
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_eligibility_decisions_scope_uq" ON "placement_eligibility_decisions" USING btree ("scope_type","scope_id");
--> statement-breakpoint
CREATE INDEX "placement_eligibility_decisions_college_idx" ON "placement_eligibility_decisions" USING btree ("college_id","scope_type");

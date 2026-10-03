CREATE TABLE "placement_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"website_url" text,
	"primary_domain" varchar(255),
	"logo_object_path" text,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_companies_status_ck" CHECK ("placement_companies"."status" in ('ACTIVE', 'ARCHIVED'))
);
--> statement-breakpoint
CREATE TABLE "placement_company_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'ACTIVE' NOT NULL,
	"is_trusted" boolean DEFAULT false NOT NULL,
	"owner_membership_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_company_relationships_status_ck" CHECK ("placement_company_relationships"."status" in ('ACTIVE', 'ARCHIVED')),
	CONSTRAINT "placement_company_relationships_archive_shape_ck" CHECK (("placement_company_relationships"."status" = 'ARCHIVED') = ("placement_company_relationships"."archived_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "placement_companies" ADD CONSTRAINT "placement_companies_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_company_relationships" ADD CONSTRAINT "placement_company_relationships_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_company_relationships" ADD CONSTRAINT "placement_company_relationships_company_id_placement_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."placement_companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_company_relationships" ADD CONSTRAINT "placement_company_relationships_owner_membership_id_college_memberships_id_fk" FOREIGN KEY ("owner_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_company_relationships" ADD CONSTRAINT "placement_company_relationships_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_companies_name_uq" ON "placement_companies" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "placement_companies_domain_uq" ON "placement_companies" USING btree (lower("primary_domain")) WHERE "placement_companies"."primary_domain" is not null;--> statement-breakpoint
CREATE INDEX "placement_companies_status_idx" ON "placement_companies" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_company_relationships_college_company_uq" ON "placement_company_relationships" USING btree ("college_id","company_id");--> statement-breakpoint
CREATE INDEX "placement_company_relationships_college_status_idx" ON "placement_company_relationships" USING btree ("college_id","status");--> statement-breakpoint
CREATE INDEX "placement_company_relationships_company_idx" ON "placement_company_relationships" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "placement_company_relationships_owner_idx" ON "placement_company_relationships" USING btree ("owner_membership_id","status");

CREATE TABLE "placement_recruiter_profiles" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "company_id" uuid NOT NULL,
  "title" varchar(160),
  "status" varchar(24) DEFAULT 'ACTIVE' NOT NULL,
  "created_by_user_id" uuid NOT NULL,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_recruiter_profiles_status_ck" CHECK ("placement_recruiter_profiles"."status" in ('ACTIVE', 'ARCHIVED')),
  CONSTRAINT "placement_recruiter_profiles_archive_shape_ck" CHECK (("placement_recruiter_profiles"."status" = 'ARCHIVED') = ("placement_recruiter_profiles"."archived_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "placement_recruiter_college_grants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "recruiter_user_id" uuid NOT NULL,
  "company_relationship_id" uuid NOT NULL,
  "status" varchar(24) DEFAULT 'ACTIVE' NOT NULL,
  "granted_by_user_id" uuid NOT NULL,
  "revoked_by_user_id" uuid,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_recruiter_college_grants_status_ck" CHECK ("placement_recruiter_college_grants"."status" in ('ACTIVE', 'REVOKED')),
  CONSTRAINT "placement_recruiter_college_grants_lifecycle_ck" CHECK (("placement_recruiter_college_grants"."status" = 'ACTIVE' and "placement_recruiter_college_grants"."revoked_by_user_id" is null and "placement_recruiter_college_grants"."revoked_at" is null) or ("placement_recruiter_college_grants"."status" = 'REVOKED' and "placement_recruiter_college_grants"."revoked_by_user_id" is not null and "placement_recruiter_college_grants"."revoked_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "placement_recruiter_profiles" ADD CONSTRAINT "placement_recruiter_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_recruiter_profiles" ADD CONSTRAINT "placement_recruiter_profiles_company_id_placement_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."placement_companies"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_recruiter_profiles" ADD CONSTRAINT "placement_recruiter_profiles_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_recruiter_college_grants" ADD CONSTRAINT "placement_recruiter_college_grants_recruiter_user_id_placement_recruiter_profiles_user_id_fk" FOREIGN KEY ("recruiter_user_id") REFERENCES "public"."placement_recruiter_profiles"("user_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_recruiter_college_grants" ADD CONSTRAINT "placement_recruiter_college_grants_company_relationship_id_placement_company_relationships_id_fk" FOREIGN KEY ("company_relationship_id") REFERENCES "public"."placement_company_relationships"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_recruiter_college_grants" ADD CONSTRAINT "placement_recruiter_college_grants_granted_by_user_id_users_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_recruiter_college_grants" ADD CONSTRAINT "placement_recruiter_college_grants_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "placement_recruiter_profiles_company_status_idx" ON "placement_recruiter_profiles" USING btree ("company_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_recruiter_college_grants_active_uq" ON "placement_recruiter_college_grants" USING btree ("recruiter_user_id","company_relationship_id") WHERE "placement_recruiter_college_grants"."status" = 'ACTIVE';
--> statement-breakpoint
CREATE INDEX "placement_recruiter_college_grants_recruiter_status_idx" ON "placement_recruiter_college_grants" USING btree ("recruiter_user_id","status");
--> statement-breakpoint
CREATE INDEX "placement_recruiter_college_grants_relationship_status_idx" ON "placement_recruiter_college_grants" USING btree ("company_relationship_id","status");

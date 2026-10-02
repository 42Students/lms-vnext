CREATE TYPE "public"."college_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('LEARNER', 'FACULTY', 'COLLEGE_ADMIN', 'MENTOR', 'TPO');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('ACTIVE', 'SUSPENDED', 'ENDED');--> statement-breakpoint
CREATE TYPE "public"."organization_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."system_role" AS ENUM('SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_platform_status" AS ENUM('ACTIVE', 'DISABLED');--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" "organization_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "colleges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" varchar(64) NOT NULL,
	"logo_object_path" text,
	"address_line1" text,
	"address_line2" text,
	"landmark" text,
	"city" varchar(128),
	"state" varchar(128),
	"country" varchar(128),
	"postal_code" varchar(32),
	"status" "college_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_uid" varchar(128) NOT NULL,
	"phone_e164" varchar(32),
	"email" text,
	"display_name" text,
	"platform_status" "user_platform_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_identity_uid_unique" UNIQUE("identity_uid"),
	CONSTRAINT "users_phone_e164_unique" UNIQUE("phone_e164")
);
--> statement-breakpoint
CREATE TABLE "college_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"status" "membership_status" DEFAULT 'ACTIVE' NOT NULL,
	"suspended_at" timestamp with time zone,
	"suspension_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "system_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"name" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculty_profiles" (
	"membership_id" uuid PRIMARY KEY NOT NULL,
	"primary_department_id" uuid,
	"employment_type" varchar(128),
	"academic_title" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learner_profiles" (
	"membership_id" uuid PRIMARY KEY NOT NULL,
	"roll_number" varchar(128),
	"registration_number" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"host" varchar(255) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(255),
	"verified_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"last_check_result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_domains_primary_verified_ck" CHECK (not "tenant_domains"."is_primary" or "tenant_domains"."is_verified")
);
--> statement-breakpoint
CREATE TABLE "legacy_id_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legacy_entity_type" text NOT NULL,
	"legacy_id" text NOT NULL,
	"new_entity_type" text NOT NULL,
	"new_id" uuid NOT NULL,
	"metadata" jsonb,
	"migrated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_memberships" ADD CONSTRAINT "college_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "college_memberships" ADD CONSTRAINT "college_memberships_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_roles" ADD CONSTRAINT "system_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_primary_department_id_departments_id_fk" FOREIGN KEY ("primary_department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_profiles" ADD CONSTRAINT "learner_profiles_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_domains" ADD CONSTRAINT "tenant_domains_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_active_name_uq" ON "organizations" USING btree (lower("name")) WHERE "organizations"."status" = 'ACTIVE';--> statement-breakpoint
CREATE UNIQUE INDEX "colleges_code_uq" ON "colleges" USING btree (lower("code"));--> statement-breakpoint
CREATE INDEX "colleges_organization_idx" ON "colleges" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "colleges_organization_status_idx" ON "colleges" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_ci_uq" ON "users" USING btree (lower("email")) WHERE "users"."email" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "college_memberships_user_college_uq" ON "college_memberships" USING btree ("user_id","college_id");--> statement-breakpoint
CREATE INDEX "college_memberships_college_status_idx" ON "college_memberships" USING btree ("college_id","status");--> statement-breakpoint
CREATE INDEX "college_memberships_user_status_idx" ON "college_memberships" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_roles_membership_role_uq" ON "membership_roles" USING btree ("membership_id","role");--> statement-breakpoint
CREATE INDEX "membership_roles_role_idx" ON "membership_roles" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "system_roles_user_role_uq" ON "system_roles" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "system_roles_role_idx" ON "system_roles" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_active_college_name_uq" ON "departments" USING btree ("college_id",lower("name")) WHERE "departments"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "departments_college_idx" ON "departments" USING btree ("college_id");--> statement-breakpoint
CREATE INDEX "faculty_profiles_primary_department_idx" ON "faculty_profiles" USING btree ("primary_department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_domains_host_uq" ON "tenant_domains" USING btree (lower("host"));--> statement-breakpoint
CREATE INDEX "tenant_domains_college_idx" ON "tenant_domains" USING btree ("college_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_domains_college_primary_uq" ON "tenant_domains" USING btree ("college_id") WHERE "tenant_domains"."is_primary" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_id_map_source_target_uq" ON "legacy_id_map" USING btree ("legacy_entity_type","legacy_id","new_entity_type");--> statement-breakpoint
CREATE INDEX "legacy_id_map_new_id_idx" ON "legacy_id_map" USING btree ("new_id");
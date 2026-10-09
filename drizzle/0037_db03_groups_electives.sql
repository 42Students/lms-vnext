-- DB03 relational foundation, manual SQL; execution not yet verified on a real PostgreSQL instance.
-- Do not force elective learners into their primary sections.
CREATE TABLE "lms_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "kind" varchar(40) NOT NULL,
  "owner_scope" varchar(20) DEFAULT 'COLLEGE' NOT NULL,
  "college_id" uuid,
  "name" varchar(150) NOT NULL,
  "description" varchar(1000),
  "status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
  "capacity" integer,
  "active_count" integer DEFAULT 0 NOT NULL,
  "self_join_open_from" timestamp with time zone,
  "self_join_open_until" timestamp with time zone,
  "academic_year" varchar(20),
  "semester_number" integer,
  "config_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_by_user_id" uuid NOT NULL,
  "deleted_at" timestamp with time zone,
  "version" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "lms_groups_scope_ck" CHECK (("owner_scope" = 'PLATFORM' AND "college_id" IS NULL) OR ("owner_scope" = 'COLLEGE' AND "college_id" IS NOT NULL)),
  CONSTRAINT "lms_groups_status_ck" CHECK ("status" IN ('DRAFT','ACTIVE','CLOSED','ARCHIVED')),
  CONSTRAINT "lms_groups_kind_ck" CHECK (length(trim("kind")) > 0),
  CONSTRAINT "lms_groups_name_ck" CHECK (length(trim("name")) > 0),
  CONSTRAINT "lms_groups_capacity_ck" CHECK ("capacity" IS NULL OR "capacity" > 0),
  CONSTRAINT "lms_groups_count_ck" CHECK ("active_count" >= 0 AND ("capacity" IS NULL OR "active_count" <= "capacity")),
  CONSTRAINT "lms_groups_join_window_ck" CHECK ("self_join_open_until" IS NULL OR ("self_join_open_from" IS NOT NULL AND "self_join_open_until" >= "self_join_open_from")),
  CONSTRAINT "lms_groups_version_ck" CHECK ("version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "lms_group_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL,
  "membership_id" uuid NOT NULL,
  "member_type" varchar(20) DEFAULT 'LEARNER' NOT NULL,
  "state" varchar(20) NOT NULL,
  "source" varchar(20) NOT NULL,
  "is_locked" boolean DEFAULT false NOT NULL,
  "waitlist_position" integer,
  "note" varchar(500),
  "joined_at" timestamp with time zone,
  "version" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "lms_group_members_type_ck" CHECK ("member_type" IN ('LEARNER','FACULTY')),
  CONSTRAINT "lms_group_members_state_ck" CHECK ("state" IN ('REQUESTED','ACTIVE','WAITLISTED','REMOVED')),
  CONSTRAINT "lms_group_members_source_ck" CHECK ("source" IN ('MANUAL','CSV','RULE','SELF')),
  CONSTRAINT "lms_group_members_position_ck" CHECK ("waitlist_position" IS NULL OR "waitlist_position" > 0),
  CONSTRAINT "lms_group_members_waitlist_shape_ck" CHECK ("state" = 'WAITLISTED' OR "waitlist_position" IS NULL),
  CONSTRAINT "lms_group_members_version_ck" CHECK ("version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "lms_group_member_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL,
  "membership_id" uuid NOT NULL,
  "from_state" varchar(20),
  "to_state" varchar(20) NOT NULL,
  "source" varchar(20) NOT NULL,
  "actor_type" varchar(20) NOT NULL,
  "actor_user_id" uuid,
  "reason" varchar(500),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "lms_group_events_state_ck" CHECK ("to_state" IN ('REQUESTED','ACTIVE','WAITLISTED','REMOVED') AND ("from_state" IS NULL OR "from_state" IN ('REQUESTED','ACTIVE','WAITLISTED','REMOVED'))),
  CONSTRAINT "lms_group_events_source_ck" CHECK ("source" IN ('MANUAL','CSV','RULE','SELF')),
  CONSTRAINT "lms_group_events_actor_ck" CHECK ("actor_type" IN ('LEARNER','FACULTY','COLLEGE_ADMIN','SUPER_ADMIN','SYSTEM'))
);
--> statement-breakpoint
CREATE TABLE "lms_group_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL,
  "criteria_json" jsonb NOT NULL,
  "criteria_version" integer DEFAULT 1 NOT NULL,
  "auto_refresh" boolean DEFAULT false NOT NULL,
  "last_run_at" timestamp with time zone,
  "last_run_matched" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "lms_group_rules_criteria_version_ck" CHECK ("criteria_version" >= 1),
  CONSTRAINT "lms_group_rules_matched_ck" CHECK ("last_run_matched" IS NULL OR "last_run_matched" >= 0)
);
--> statement-breakpoint
CREATE TABLE "elective_slots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "college_id" uuid NOT NULL,
  "program_id" uuid NOT NULL,
  "academic_period_id" uuid,
  "semester_number" integer NOT NULL,
  "academic_year" varchar(20),
  "name" varchar(150) NOT NULL,
  "description" varchar(1000),
  "credits" integer DEFAULT 3 NOT NULL,
  "min_pick" integer DEFAULT 1 NOT NULL,
  "max_pick" integer DEFAULT 1 NOT NULL,
  "status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
  "deleted_at" timestamp with time zone,
  "version" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "elective_slots_semester_ck" CHECK ("semester_number" BETWEEN 1 AND 24),
  CONSTRAINT "elective_slots_picks_ck" CHECK ("credits" > 0 AND "min_pick" >= 0 AND "max_pick" >= 1 AND "min_pick" <= "max_pick"),
  CONSTRAINT "elective_slots_status_ck" CHECK ("status" IN ('ACTIVE','ARCHIVED')),
  CONSTRAINT "elective_slots_name_ck" CHECK (length(trim("name")) > 0),
  CONSTRAINT "elective_slots_version_ck" CHECK ("version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "elective_offerings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slot_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "group_id" uuid NOT NULL,
  "backed_delivery_id" uuid NOT NULL,
  "capacity" integer,
  "status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
  "deleted_at" timestamp with time zone,
  "version" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "elective_offerings_capacity_ck" CHECK ("capacity" IS NULL OR "capacity" > 0),
  CONSTRAINT "elective_offerings_status_ck" CHECK ("status" IN ('ACTIVE','ARCHIVED')),
  CONSTRAINT "elective_offerings_version_ck" CHECK ("version" >= 0)
);
--> statement-breakpoint
ALTER TABLE "lms_groups" ADD CONSTRAINT "lms_groups_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lms_groups" ADD CONSTRAINT "lms_groups_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lms_group_members" ADD CONSTRAINT "lms_group_members_group_id_lms_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."lms_groups"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lms_group_members" ADD CONSTRAINT "lms_group_members_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lms_group_member_events" ADD CONSTRAINT "lms_group_member_events_group_id_lms_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."lms_groups"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lms_group_member_events" ADD CONSTRAINT "lms_group_member_events_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lms_group_member_events" ADD CONSTRAINT "lms_group_member_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lms_group_rules" ADD CONSTRAINT "lms_group_rules_group_id_lms_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."lms_groups"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_slots" ADD CONSTRAINT "elective_slots_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_slots" ADD CONSTRAINT "elective_slots_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_slots" ADD CONSTRAINT "elective_slots_academic_period_id_academic_periods_id_fk" FOREIGN KEY ("academic_period_id") REFERENCES "public"."academic_periods"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_offerings" ADD CONSTRAINT "elective_offerings_slot_id_elective_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."elective_slots"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_offerings" ADD CONSTRAINT "elective_offerings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_offerings" ADD CONSTRAINT "elective_offerings_group_id_lms_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."lms_groups"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "elective_offerings" ADD CONSTRAINT "elective_offerings_backed_delivery_id_course_section_deliveries_id_fk" FOREIGN KEY ("backed_delivery_id") REFERENCES "public"."course_section_deliveries"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "lms_groups_college_kind_idx" ON "lms_groups" USING btree ("college_id","kind","status");
--> statement-breakpoint
CREATE INDEX "lms_groups_kind_status_idx" ON "lms_groups" USING btree ("kind","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "lms_group_members_group_membership_uq" ON "lms_group_members" USING btree ("group_id","membership_id");
--> statement-breakpoint
CREATE INDEX "lms_group_members_membership_state_idx" ON "lms_group_members" USING btree ("membership_id","state");
--> statement-breakpoint
CREATE INDEX "lms_group_members_group_state_waitlist_idx" ON "lms_group_members" USING btree ("group_id","state","waitlist_position");
--> statement-breakpoint
CREATE INDEX "lms_group_events_group_time_idx" ON "lms_group_member_events" USING btree ("group_id","created_at");
--> statement-breakpoint
CREATE INDEX "lms_group_events_member_time_idx" ON "lms_group_member_events" USING btree ("membership_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "lms_group_rules_group_uq" ON "lms_group_rules" USING btree ("group_id");
--> statement-breakpoint
CREATE INDEX "elective_slots_college_program_term_idx" ON "elective_slots" USING btree ("college_id","program_id","semester_number");
--> statement-breakpoint
CREATE INDEX "elective_slots_period_status_idx" ON "elective_slots" USING btree ("academic_period_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "elective_offerings_group_uq" ON "elective_offerings" USING btree ("group_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "elective_offerings_delivery_uq" ON "elective_offerings" USING btree ("backed_delivery_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "elective_offerings_slot_active_course_uq" ON "elective_offerings" USING btree ("slot_id","course_id") WHERE "status" = 'ACTIVE' AND "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX "elective_offerings_slot_status_idx" ON "elective_offerings" USING btree ("slot_id","status");
--> statement-breakpoint
CREATE INDEX "elective_offerings_course_idx" ON "elective_offerings" USING btree ("course_id");

-- Append-only audit contract, independently enforced even if a new writer bypasses the service.
CREATE FUNCTION db03_group_member_events_immutable() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Group member event history is append-only' USING ERRCODE = '23514';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER db03_group_member_events_no_mutation
BEFORE UPDATE OR DELETE ON "lms_group_member_events"
FOR EACH ROW EXECUTE FUNCTION db03_group_member_events_immutable();
--> statement-breakpoint

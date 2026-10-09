-- DB03 historical group creator role and event member type, source V166.
ALTER TABLE "lms_groups" ADD COLUMN "created_by_type" varchar(20);
--> statement-breakpoint
ALTER TABLE "lms_groups" ADD CONSTRAINT "lms_groups_creator_type_ck" CHECK ("created_by_type" IS NULL OR "created_by_type" IN ('LEARNER','FACULTY','COLLEGE_ADMIN','SUPER_ADMIN','SYSTEM'));
--> statement-breakpoint
ALTER TABLE "lms_group_member_events" ADD COLUMN "member_type" varchar(20) DEFAULT 'LEARNER' NOT NULL;
--> statement-breakpoint
ALTER TABLE "lms_group_member_events" ADD CONSTRAINT "lms_group_events_member_type_ck" CHECK ("member_type" IN ('LEARNER','FACULTY'));

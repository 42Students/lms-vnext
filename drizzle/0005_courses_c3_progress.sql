ALTER TABLE "lesson_contents" ADD COLUMN "duration_seconds" integer;--> statement-breakpoint
ALTER TABLE "lesson_contents" DROP CONSTRAINT "lesson_contents_shape_ck";--> statement-breakpoint
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_duration_ck" CHECK ("lesson_contents"."duration_seconds" is null or "lesson_contents"."duration_seconds" between 1 and 86400);--> statement-breakpoint
ALTER TABLE "lesson_contents" ADD CONSTRAINT "lesson_contents_shape_ck" CHECK ((
        ("lesson_contents"."content_type" = 'RESOURCE'
          and ("lesson_contents"."notes" is not null or "lesson_contents"."external_url" is not null or "lesson_contents"."storage_key" is not null)
          and "lesson_contents"."duration_seconds" is null
          and "lesson_contents"."starts_at" is null and "lesson_contents"."ends_at" is null)
        or
        ("lesson_contents"."content_type" = 'VIDEO'
          and "lesson_contents"."storage_key" is not null
          and "lesson_contents"."external_url" is null
          and "lesson_contents"."duration_seconds" is not null
          and "lesson_contents"."starts_at" is null and "lesson_contents"."ends_at" is null)
        or
        ("lesson_contents"."content_type" = 'YOUTUBE'
          and "lesson_contents"."external_url" is not null
          and "lesson_contents"."storage_key" is null
          and "lesson_contents"."duration_seconds" is not null
          and "lesson_contents"."starts_at" is null and "lesson_contents"."ends_at" is null)
        or
        ("lesson_contents"."content_type" = 'LIVE_CLASS'
          and "lesson_contents"."external_url" is not null
          and "lesson_contents"."storage_key" is null
          and "lesson_contents"."duration_seconds" is null
          and "lesson_contents"."starts_at" is not null
          and "lesson_contents"."ends_at" is not null
          and "lesson_contents"."ends_at" > "lesson_contents"."starts_at")
      ));--> statement-breakpoint
CREATE TABLE "learner_content_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"lesson_content_id" uuid NOT NULL,
	"last_position_seconds" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learner_content_progress_position_ck" CHECK ("learner_content_progress"."last_position_seconds" >= 0)
);
--> statement-breakpoint
ALTER TABLE "learner_content_progress" ADD CONSTRAINT "learner_content_progress_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_content_progress" ADD CONSTRAINT "learner_content_progress_lesson_content_id_lesson_contents_id_fk" FOREIGN KEY ("lesson_content_id") REFERENCES "public"."lesson_contents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learner_content_progress_membership_content_uq" ON "learner_content_progress" USING btree ("membership_id","lesson_content_id");--> statement-breakpoint
CREATE INDEX "learner_content_progress_membership_idx" ON "learner_content_progress" USING btree ("membership_id");--> statement-breakpoint
CREATE INDEX "learner_content_progress_content_idx" ON "learner_content_progress" USING btree ("lesson_content_id");
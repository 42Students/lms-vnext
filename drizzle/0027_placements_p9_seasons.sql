CREATE TABLE "placement_seasons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "college_id" uuid NOT NULL,
  "name" text NOT NULL,
  "code" varchar(64) NOT NULL,
  "start_date" date NOT NULL,
  "end_date" date NOT NULL,
  "status" varchar(24) DEFAULT 'ACTIVE' NOT NULL,
  "created_by_user_id" uuid NOT NULL,
  "closed_by_user_id" uuid,
  "closed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_seasons_name_ck" CHECK (length(trim("placement_seasons"."name")) > 0 and length(trim("placement_seasons"."code")) > 0),
  CONSTRAINT "placement_seasons_dates_ck" CHECK ("placement_seasons"."end_date" >= "placement_seasons"."start_date"),
  CONSTRAINT "placement_seasons_status_ck" CHECK ("placement_seasons"."status" in ('ACTIVE', 'CLOSED')),
  CONSTRAINT "placement_seasons_lifecycle_ck" CHECK (("placement_seasons"."status" = 'ACTIVE'
          and "placement_seasons"."closed_by_user_id" is null
          and "placement_seasons"."closed_at" is null)
        or ("placement_seasons"."status" = 'CLOSED'
          and "placement_seasons"."closed_by_user_id" is not null
          and "placement_seasons"."closed_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD COLUMN "season_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "placement_seasons" ADD CONSTRAINT "placement_seasons_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_seasons" ADD CONSTRAINT "placement_seasons_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_seasons" ADD CONSTRAINT "placement_seasons_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD CONSTRAINT "placement_jobs_season_id_placement_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."placement_seasons"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_seasons_college_code_uq" ON "placement_seasons" USING btree ("college_id",lower("code"));
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_seasons_active_college_uq" ON "placement_seasons" USING btree ("college_id") WHERE "placement_seasons"."status" = 'ACTIVE';
--> statement-breakpoint
CREATE INDEX "placement_seasons_college_status_idx" ON "placement_seasons" USING btree ("college_id","status","start_date");
--> statement-breakpoint
CREATE INDEX "placement_jobs_season_status_idx" ON "placement_jobs" USING btree ("season_id","status");

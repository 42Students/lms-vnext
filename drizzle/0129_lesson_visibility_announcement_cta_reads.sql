CREATE TABLE "placement_cell_announcement_reads" (
	"announcement_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"first_read_by_user_id" uuid NOT NULL,
	"first_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_cell_announcement_reads_announcement_id_college_id_pk" PRIMARY KEY("announcement_id","college_id")
);
--> statement-breakpoint
ALTER TABLE "course_lessons" ADD COLUMN "visible_to_students" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "button_label" varchar(60);--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "button_url" varchar(500);--> statement-breakpoint
ALTER TABLE "placement_cell_announcement_reads" ADD CONSTRAINT "placement_cell_announcement_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_cell_announcement_reads" ADD CONSTRAINT "placement_cell_announcement_reads_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_cell_announcement_reads" ADD CONSTRAINT "placement_cell_announcement_reads_first_read_by_user_id_users_id_fk" FOREIGN KEY ("first_read_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placement_cell_announcement_reads_by_college_idx" ON "placement_cell_announcement_reads" USING btree ("college_id","first_read_at" desc);--> statement-breakpoint
CREATE INDEX "course_lessons_active_visible_idx" ON "course_lessons" USING btree ("learning_path_id","visible_to_students","sequence") WHERE "course_lessons"."status" = 'ACTIVE';--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_cta_pair_ck" CHECK (("announcements"."button_label" is null and "announcements"."button_url" is null)
        or ("announcements"."button_label" is not null and length(trim("announcements"."button_label")) between 1 and 60
          and "announcements"."button_url" is not null and "announcements"."button_url" ~ '^https://[^[:space:]]+$'));
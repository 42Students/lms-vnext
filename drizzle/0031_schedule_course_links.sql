CREATE TABLE "section_schedule_event_courses" (
	"schedule_event_id" uuid PRIMARY KEY NOT NULL,
	"delivery_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "section_schedule_event_courses" ADD CONSTRAINT "section_schedule_event_courses_schedule_event_id_section_schedule_events_id_fk" FOREIGN KEY ("schedule_event_id") REFERENCES "public"."section_schedule_events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "section_schedule_event_courses" ADD CONSTRAINT "section_schedule_event_courses_delivery_id_course_section_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."course_section_deliveries"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "section_schedule_event_courses_delivery_idx" ON "section_schedule_event_courses" USING btree ("delivery_id");

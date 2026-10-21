-- Old classroom messages were keyed by class/course/term IDs.
-- Resolve exactly one same-college section delivery per historical class,
-- course and academic period. Do not infer a UUID from a numeric class ID.
-- Preserve sender membership roles, 64-bit source IDs, pin state and
-- microsecond timestamps. Feed cursor uses (created_at,id), descending
-- query reversed for display, so equal-time messages cannot disappear.
CREATE TABLE "course_discussion_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"sender_membership_id" uuid NOT NULL,
	"sender_role" varchar(24) NOT NULL,
	"message_text" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"pinned_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_discussion_messages_sender_role_ck" CHECK ("course_discussion_messages"."sender_role" in ('LEARNER', 'FACULTY', 'ADMIN')),
	CONSTRAINT "course_discussion_messages_text_ck" CHECK (length(trim("course_discussion_messages"."message_text")) between 1 and 4000),
	CONSTRAINT "course_discussion_messages_pin_ck" CHECK (("course_discussion_messages"."pinned" = false and "course_discussion_messages"."pinned_by_user_id" is null) or ("course_discussion_messages"."pinned" = true and "course_discussion_messages"."pinned_by_user_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "course_discussion_messages" ADD CONSTRAINT "course_discussion_messages_delivery_id_course_section_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."course_section_deliveries"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "course_discussion_messages" ADD CONSTRAINT "course_discussion_messages_sender_membership_id_college_memberships_id_fk" FOREIGN KEY ("sender_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "course_discussion_messages" ADD CONSTRAINT "course_discussion_messages_pinned_by_user_id_users_id_fk" FOREIGN KEY ("pinned_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "course_discussion_messages_delivery_created_idx" ON "course_discussion_messages" USING btree ("delivery_id","created_at");
--> statement-breakpoint
CREATE INDEX "course_discussion_messages_delivery_pinned_idx" ON "course_discussion_messages" USING btree ("delivery_id","pinned");

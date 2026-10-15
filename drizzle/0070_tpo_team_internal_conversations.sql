CREATE TABLE "placement_tpo_internal_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"author_membership_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_internal_messages_body_ck" CHECK (length(btrim("placement_tpo_internal_messages"."body")) between 1 and 4000)
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_internal_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"started_by_membership_id" uuid NOT NULL,
	"invited_membership_id" uuid NOT NULL,
	"topic" varchar(160) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_internal_threads_topic_ck" CHECK (length(btrim("placement_tpo_internal_threads"."topic")) > 0),
	CONSTRAINT "placement_tpo_internal_threads_distinct_ck" CHECK ("placement_tpo_internal_threads"."started_by_membership_id" <> "placement_tpo_internal_threads"."invited_membership_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_internal_threads_id_college_uq" ON "placement_tpo_internal_threads" USING btree ("id","college_id");
--> statement-breakpoint
ALTER TABLE "placement_tpo_internal_messages" ADD CONSTRAINT "placement_tpo_internal_messages_thread_college_fk" FOREIGN KEY ("thread_id","college_id") REFERENCES "public"."placement_tpo_internal_threads"("id","college_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_tpo_internal_messages" ADD CONSTRAINT "placement_tpo_internal_messages_author_college_fk" FOREIGN KEY ("author_membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_tpo_internal_threads" ADD CONSTRAINT "placement_tpo_internal_threads_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_tpo_internal_threads" ADD CONSTRAINT "placement_tpo_internal_threads_started_by_college_fk" FOREIGN KEY ("started_by_membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_tpo_internal_threads" ADD CONSTRAINT "placement_tpo_internal_threads_invited_college_fk" FOREIGN KEY ("invited_membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "tpo_internal_messages_thread_idx" ON "placement_tpo_internal_messages" USING btree ("thread_id","created_at");
--> statement-breakpoint
CREATE INDEX "tpo_internal_threads_college_idx" ON "placement_tpo_internal_threads" USING btree ("college_id","created_at");
--> statement-breakpoint
-- Hand-written: an author must be one of the thread's two participants.
CREATE FUNCTION tpo_internal_message_author_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM placement_tpo_internal_threads t
    WHERE t.id = NEW.thread_id
      AND NEW.author_membership_id IN (t.started_by_membership_id, t.invited_membership_id)
  ) THEN
    RAISE EXCEPTION 'Author is not a participant of this TPO internal thread' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER tpo_internal_message_author_guard
BEFORE INSERT OR UPDATE ON placement_tpo_internal_messages
FOR EACH ROW EXECUTE FUNCTION tpo_internal_message_author_guard();

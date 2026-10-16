CREATE TABLE "assignment_submission_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"kind" text NOT NULL,
	"url" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignment_submission_links_sequence_ck" CHECK ("assignment_submission_links"."sequence" between 0 and 19),
	CONSTRAINT "assignment_submission_links_kind_ck" CHECK ("assignment_submission_links"."kind" in ('REPOSITORY_LINK','EXTERNAL_LINK'))
);
--> statement-breakpoint
ALTER TABLE "assignment_submissions" DROP CONSTRAINT "assignment_submissions_payload_ck";--> statement-breakpoint
ALTER TABLE "course_assignments" ADD COLUMN "allowed_submission_methods" jsonb DEFAULT '["WRITTEN_RESPONSE","PDF_UPLOAD","FILE_UPLOAD","REPOSITORY_LINK","EXTERNAL_LINK"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment_submission_links" ADD CONSTRAINT "assignment_submission_links_submission_id_assignment_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."assignment_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_submission_links_submission_sequence_uq" ON "assignment_submission_links" USING btree ("submission_id","sequence");--> statement-breakpoint
CREATE INDEX "assignment_submission_links_submission_idx" ON "assignment_submission_links" USING btree ("submission_id");--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_payload_ck" CHECK ((
        ("assignment_submissions"."submission_type" = 'TEXT'
          and "assignment_submissions"."text_content" is not null
          and length(trim("assignment_submissions"."text_content")) > 0
          and "assignment_submissions"."submission_url" is null)
        or
        ("assignment_submissions"."submission_type" = 'LINK'
          and "assignment_submissions"."submission_url" is not null
          and "assignment_submissions"."text_content" is null)
        or
        ("assignment_submissions"."submission_type" = 'FILE')
      ));--> statement-breakpoint
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_methods_shape_ck" CHECK (jsonb_typeof("course_assignments"."allowed_submission_methods") = 'array' and jsonb_array_length("course_assignments"."allowed_submission_methods") between 1 and 5);
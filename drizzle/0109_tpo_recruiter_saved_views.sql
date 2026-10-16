CREATE TABLE "placement_tpo_recruiter_saved_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"note" varchar(500),
	"query_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"columns_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tpo_recruiter_saved_view_name_uq" UNIQUE("college_id","owner_user_id","name"),
	CONSTRAINT "tpo_recruiter_saved_view_query_ck" CHECK (jsonb_typeof("placement_tpo_recruiter_saved_views"."query_json")='object'),
	CONSTRAINT "tpo_recruiter_saved_view_columns_ck" CHECK (jsonb_typeof("placement_tpo_recruiter_saved_views"."columns_json")='array')
);
--> statement-breakpoint
ALTER TABLE "placement_tpo_recruiter_saved_views" ADD CONSTRAINT "placement_tpo_recruiter_saved_views_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_recruiter_saved_views" ADD CONSTRAINT "placement_tpo_recruiter_saved_views_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tpo_recruiter_saved_views_owner_idx" ON "placement_tpo_recruiter_saved_views" USING btree ("college_id","owner_user_id","pinned" desc,"updated_at" desc);
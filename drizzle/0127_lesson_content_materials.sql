CREATE TABLE "lesson_content_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_content_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"external_url" text,
	"storage_key" text,
	"original_name" text,
	"mime_type" text,
	"size_bytes" integer,
	"sequence" integer NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"upload_status" text DEFAULT 'READY' NOT NULL,
	"upload_token_hash" varchar(64),
	"upload_expires_at" timestamp with time zone,
	"object_generation" text,
	"scan_status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"scan_attested_by" varchar(80),
	"scan_attested_at" timestamp with time zone,
	"verified_size_bytes" bigint,
	"verified_content_type" varchar(128),
	"completed_at" timestamp with time zone,
	"failure_code" varchar(64),
	CONSTRAINT "lesson_content_materials_kind_ck" CHECK ("lesson_content_materials"."kind" in ('LINK', 'FILE')),
	CONSTRAINT "lesson_content_materials_sequence_ck" CHECK ("lesson_content_materials"."sequence" >= 0),
	CONSTRAINT "lesson_content_materials_size_ck" CHECK ("lesson_content_materials"."size_bytes" is null or ("lesson_content_materials"."size_bytes" > 0 and "lesson_content_materials"."size_bytes" <= 52428800)),
	CONSTRAINT "lesson_content_materials_upload_status_ck" CHECK ("lesson_content_materials"."upload_status" in ('UPLOADING','VERIFYING','READY','QUARANTINED','FAILED','DELETED')),
	CONSTRAINT "lesson_content_materials_scan_status_ck" CHECK ("lesson_content_materials"."scan_status" in ('PENDING','CLEAN','REJECTED')),
	CONSTRAINT "lesson_content_materials_ready_ck" CHECK ("lesson_content_materials"."kind" <> 'FILE' or "lesson_content_materials"."upload_status" <> 'READY' or ("lesson_content_materials"."scan_status" = 'CLEAN' and "lesson_content_materials"."scan_attested_by" is not null and "lesson_content_materials"."scan_attested_at" is not null and "lesson_content_materials"."object_generation" is not null and "lesson_content_materials"."verified_size_bytes" between 1 and 52428800 and "lesson_content_materials"."verified_content_type" is not null and "lesson_content_materials"."completed_at" is not null)),
	CONSTRAINT "lesson_content_materials_shape_ck" CHECK (("lesson_content_materials"."kind" = 'LINK' and "lesson_content_materials"."external_url" is not null and "lesson_content_materials"."storage_key" is null and "lesson_content_materials"."original_name" is null and "lesson_content_materials"."mime_type" is null and "lesson_content_materials"."size_bytes" is null) or ("lesson_content_materials"."kind" = 'FILE' and "lesson_content_materials"."external_url" is null and "lesson_content_materials"."storage_key" is not null and "lesson_content_materials"."original_name" is not null and "lesson_content_materials"."mime_type" is not null and "lesson_content_materials"."size_bytes" is not null))
);
--> statement-breakpoint
ALTER TABLE "lesson_content_materials" ADD CONSTRAINT "lesson_content_materials_lesson_content_id_lesson_contents_id_fk" FOREIGN KEY ("lesson_content_id") REFERENCES "public"."lesson_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_content_materials" ADD CONSTRAINT "lesson_content_materials_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_content_materials_content_sequence_uq" ON "lesson_content_materials" USING btree ("lesson_content_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_content_materials_storage_key_uq" ON "lesson_content_materials" USING btree ("storage_key") WHERE "lesson_content_materials"."storage_key" is not null;--> statement-breakpoint
CREATE INDEX "lesson_content_materials_content_kind_idx" ON "lesson_content_materials" USING btree ("lesson_content_id","kind");

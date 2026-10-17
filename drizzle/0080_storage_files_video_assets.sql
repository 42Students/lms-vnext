CREATE TABLE "assignment_submission_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"delivery_id" uuid NOT NULL,
	"owner_membership_id" uuid NOT NULL,
	"submission_id" uuid,
	"sequence" integer,
	"object_key" text NOT NULL,
	"upload_token_hash" varchar(64) NOT NULL,
	"upload_expires_at" timestamp with time zone NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"declared_content_type" varchar(128) NOT NULL,
	"declared_size_bytes" bigint NOT NULL,
	"status" varchar(16) DEFAULT 'UPLOADING' NOT NULL,
	"object_generation" text,
	"verified_content_type" varchar(128),
	"verified_size_bytes" bigint,
	"sha256_hex" varchar(64),
	"scan_status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"scan_attested_by" varchar(80),
	"scan_attested_at" timestamp with time zone,
	"failure_code" varchar(64),
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"deleted_by_user_id" uuid,
	CONSTRAINT "assignment_submission_files_status_ck" CHECK ("assignment_submission_files"."status" in ('UPLOADING','VERIFYING','READY','QUARANTINED','FAILED','DELETED')),
	CONSTRAINT "assignment_submission_files_scan_status_ck" CHECK ("assignment_submission_files"."scan_status" in ('PENDING','CLEAN','REJECTED')),
	CONSTRAINT "assignment_submission_files_declared_size_ck" CHECK ("assignment_submission_files"."declared_size_bytes" between 1 and 52428800),
	CONSTRAINT "assignment_submission_files_verified_size_ck" CHECK ("assignment_submission_files"."verified_size_bytes" is null or "assignment_submission_files"."verified_size_bytes" between 1 and 52428800),
	CONSTRAINT "assignment_submission_files_content_type_ck" CHECK (length(trim("assignment_submission_files"."declared_content_type")) between 3 and 128 and position('/' in "assignment_submission_files"."declared_content_type") > 1),
	CONSTRAINT "assignment_submission_files_name_ck" CHECK (length(trim("assignment_submission_files"."original_name")) between 1 and 255 and "assignment_submission_files"."original_name" !~ '[/\\]' and trim("assignment_submission_files"."original_name") not in ('.', '..')),
	CONSTRAINT "assignment_submission_files_token_hash_ck" CHECK ("assignment_submission_files"."upload_token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "assignment_submission_files_sha_ck" CHECK ("assignment_submission_files"."sha256_hex" is null or "assignment_submission_files"."sha256_hex" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "assignment_submission_files_object_key_ck" CHECK ("assignment_submission_files"."object_key" like ('private/' || "assignment_submission_files"."college_id"::text || '/' || "assignment_submission_files"."owner_membership_id"::text || '/assignment-submission/%')),
	CONSTRAINT "assignment_submission_files_sequence_ck" CHECK ("assignment_submission_files"."sequence" is null or "assignment_submission_files"."sequence" >= 0),
	CONSTRAINT "assignment_submission_files_sequence_submission_ck" CHECK ("assignment_submission_files"."sequence" is null or "assignment_submission_files"."submission_id" is not null),
	CONSTRAINT "assignment_submission_files_ready_ck" CHECK ("assignment_submission_files"."status" <> 'READY' or ("assignment_submission_files"."scan_status" = 'CLEAN' and "assignment_submission_files"."scan_attested_by" is not null and "assignment_submission_files"."scan_attested_at" is not null and "assignment_submission_files"."object_generation" ~ '^[0-9]+$' and "assignment_submission_files"."verified_size_bytes" is not null and "assignment_submission_files"."verified_content_type" is not null and "assignment_submission_files"."completed_at" is not null)),
	CONSTRAINT "assignment_submission_files_deleted_ck" CHECK (("assignment_submission_files"."status" = 'DELETED') = ("assignment_submission_files"."deleted_at" is not null)),
	CONSTRAINT "assignment_submission_files_submitted_ready_ck" CHECK ("assignment_submission_files"."submission_id" is null or "assignment_submission_files"."status" in ('READY','DELETED'))
);
--> statement-breakpoint
CREATE TABLE "lesson_video_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"delivery_id" uuid,
	"lesson_content_id" uuid,
	"uploader_membership_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"sequence" integer DEFAULT 0 NOT NULL,
	"publish_status" varchar(16) DEFAULT 'DRAFT' NOT NULL,
	"visible_to_students" boolean DEFAULT true NOT NULL,
	"processing_status" varchar(16) DEFAULT 'UPLOADING' NOT NULL,
	"duration_seconds" integer,
	"object_key" text NOT NULL,
	"upload_token_hash" varchar(64) NOT NULL,
	"upload_expires_at" timestamp with time zone NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"declared_content_type" varchar(128) NOT NULL,
	"declared_size_bytes" bigint NOT NULL,
	"object_generation" text,
	"verified_content_type" varchar(128),
	"verified_size_bytes" bigint,
	"scan_status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"scan_attested_by" varchar(80),
	"scan_attested_at" timestamp with time zone,
	"thumbnail_status" varchar(16) DEFAULT 'NONE' NOT NULL,
	"thumbnail_object_key" text,
	"thumbnail_upload_token_hash" varchar(64),
	"thumbnail_upload_expires_at" timestamp with time zone,
	"thumbnail_content_type" varchar(128),
	"thumbnail_size_bytes" integer,
	"thumbnail_generation" text,
	"replaces_asset_id" uuid,
	"failure_code" varchar(64),
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"deleted_by_user_id" uuid,
	CONSTRAINT "lesson_video_assets_title_ck" CHECK (length(trim("lesson_video_assets"."title")) between 1 and 255),
	CONSTRAINT "lesson_video_assets_sequence_ck" CHECK ("lesson_video_assets"."sequence" >= 0),
	CONSTRAINT "lesson_video_assets_publish_status_ck" CHECK ("lesson_video_assets"."publish_status" in ('DRAFT','PUBLISHED','ARCHIVED')),
	CONSTRAINT "lesson_video_assets_processing_status_ck" CHECK ("lesson_video_assets"."processing_status" in ('UPLOADING','PROCESSING','READY','FAILED','BLOCKED')),
	CONSTRAINT "lesson_video_assets_scan_status_ck" CHECK ("lesson_video_assets"."scan_status" in ('PENDING','CLEAN','REJECTED')),
	CONSTRAINT "lesson_video_assets_thumbnail_status_ck" CHECK ("lesson_video_assets"."thumbnail_status" in ('NONE','UPLOADING','READY')),
	CONSTRAINT "lesson_video_assets_duration_ck" CHECK ("lesson_video_assets"."duration_seconds" is null or "lesson_video_assets"."duration_seconds" between 1 and 86400),
	CONSTRAINT "lesson_video_assets_declared_size_ck" CHECK ("lesson_video_assets"."declared_size_bytes" between 1 and 5138022400),
	CONSTRAINT "lesson_video_assets_verified_size_ck" CHECK ("lesson_video_assets"."verified_size_bytes" is null or "lesson_video_assets"."verified_size_bytes" between 1 and 5138022400),
	CONSTRAINT "lesson_video_assets_content_type_ck" CHECK ("lesson_video_assets"."declared_content_type" like 'video/%' and length(trim("lesson_video_assets"."declared_content_type")) between 7 and 128),
	CONSTRAINT "lesson_video_assets_name_ck" CHECK (length(trim("lesson_video_assets"."original_name")) between 1 and 255 and "lesson_video_assets"."original_name" !~ '[/\\]' and trim("lesson_video_assets"."original_name") not in ('.', '..')),
	CONSTRAINT "lesson_video_assets_token_hash_ck" CHECK ("lesson_video_assets"."upload_token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "lesson_video_assets_object_key_ck" CHECK ("lesson_video_assets"."object_key" like ('private/' || "lesson_video_assets"."college_id"::text || '/' || "lesson_video_assets"."uploader_membership_id"::text || '/lesson-video/%')),
	CONSTRAINT "lesson_video_assets_thumbnail_shape_ck" CHECK (("lesson_video_assets"."thumbnail_status" = 'NONE' and "lesson_video_assets"."thumbnail_object_key" is null and "lesson_video_assets"."thumbnail_content_type" is null and "lesson_video_assets"."thumbnail_size_bytes" is null) or ("lesson_video_assets"."thumbnail_status" <> 'NONE' and "lesson_video_assets"."thumbnail_object_key" is not null and "lesson_video_assets"."thumbnail_upload_token_hash" ~ '^[0-9a-f]{64}$' and "lesson_video_assets"."thumbnail_content_type" in ('image/jpeg','image/png','image/webp') and "lesson_video_assets"."thumbnail_size_bytes" between 1 and 5242880 and "lesson_video_assets"."thumbnail_object_key" like ('private/' || "lesson_video_assets"."college_id"::text || '/' || "lesson_video_assets"."uploader_membership_id"::text || '/lesson-video/%'))),
	CONSTRAINT "lesson_video_assets_thumbnail_ready_ck" CHECK ("lesson_video_assets"."thumbnail_status" <> 'READY' or "lesson_video_assets"."thumbnail_generation" ~ '^[0-9]+$'),
	CONSTRAINT "lesson_video_assets_ready_ck" CHECK ("lesson_video_assets"."processing_status" <> 'READY' or ("lesson_video_assets"."scan_status" = 'CLEAN' and "lesson_video_assets"."scan_attested_by" is not null and "lesson_video_assets"."scan_attested_at" is not null and "lesson_video_assets"."object_generation" ~ '^[0-9]+$' and "lesson_video_assets"."verified_size_bytes" is not null and "lesson_video_assets"."verified_content_type" is not null and "lesson_video_assets"."completed_at" is not null)),
	CONSTRAINT "lesson_video_assets_published_ready_ck" CHECK ("lesson_video_assets"."publish_status" <> 'PUBLISHED' or "lesson_video_assets"."processing_status" = 'READY'),
	CONSTRAINT "lesson_video_assets_replaces_self_ck" CHECK ("lesson_video_assets"."replaces_asset_id" is null or "lesson_video_assets"."replaces_asset_id" <> "lesson_video_assets"."id")
);
--> statement-breakpoint
CREATE TABLE "project_resource_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"resource_id" uuid,
	"uploader_membership_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"object_key" text NOT NULL,
	"upload_token_hash" varchar(64) NOT NULL,
	"upload_expires_at" timestamp with time zone NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"declared_content_type" varchar(128) NOT NULL,
	"declared_size_bytes" bigint NOT NULL,
	"status" varchar(16) DEFAULT 'UPLOADING' NOT NULL,
	"object_generation" text,
	"verified_content_type" varchar(128),
	"verified_size_bytes" bigint,
	"sha256_hex" varchar(64),
	"scan_status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"scan_attested_by" varchar(80),
	"scan_attested_at" timestamp with time zone,
	"failure_code" varchar(64),
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"deleted_by_user_id" uuid,
	CONSTRAINT "project_resource_files_status_ck" CHECK ("project_resource_files"."status" in ('UPLOADING','VERIFYING','READY','QUARANTINED','FAILED','DELETED')),
	CONSTRAINT "project_resource_files_scan_status_ck" CHECK ("project_resource_files"."scan_status" in ('PENDING','CLEAN','REJECTED')),
	CONSTRAINT "project_resource_files_declared_size_ck" CHECK ("project_resource_files"."declared_size_bytes" between 1 and 52428800),
	CONSTRAINT "project_resource_files_verified_size_ck" CHECK ("project_resource_files"."verified_size_bytes" is null or "project_resource_files"."verified_size_bytes" between 1 and 52428800),
	CONSTRAINT "project_resource_files_content_type_ck" CHECK (length(trim("project_resource_files"."declared_content_type")) between 3 and 128 and position('/' in "project_resource_files"."declared_content_type") > 1),
	CONSTRAINT "project_resource_files_name_ck" CHECK (length(trim("project_resource_files"."original_name")) between 1 and 255 and "project_resource_files"."original_name" !~ '[/\\]' and trim("project_resource_files"."original_name") not in ('.', '..')),
	CONSTRAINT "project_resource_files_title_ck" CHECK (length(trim("project_resource_files"."title")) between 1 and 200),
	CONSTRAINT "project_resource_files_token_hash_ck" CHECK ("project_resource_files"."upload_token_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "project_resource_files_sha_ck" CHECK ("project_resource_files"."sha256_hex" is null or "project_resource_files"."sha256_hex" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "project_resource_files_object_key_ck" CHECK ("project_resource_files"."object_key" like ('private/' || "project_resource_files"."college_id"::text || '/' || "project_resource_files"."uploader_membership_id"::text || '/project-resource/%')),
	CONSTRAINT "project_resource_files_ready_ck" CHECK ("project_resource_files"."status" <> 'READY' or ("project_resource_files"."scan_status" = 'CLEAN' and "project_resource_files"."scan_attested_by" is not null and "project_resource_files"."scan_attested_at" is not null and "project_resource_files"."object_generation" ~ '^[0-9]+$' and "project_resource_files"."verified_size_bytes" is not null and "project_resource_files"."verified_content_type" is not null and "project_resource_files"."completed_at" is not null)),
	CONSTRAINT "project_resource_files_deleted_ck" CHECK (("project_resource_files"."status" = 'DELETED') = ("project_resource_files"."deleted_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "storage_file_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"subject_kind" varchar(32) NOT NULL,
	"subject_id" uuid NOT NULL,
	"event_type" varchar(40) NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"actor_membership_id" uuid,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "storage_file_events_subject_kind_ck" CHECK ("storage_file_events"."subject_kind" in ('ASSIGNMENT_SUBMISSION_FILE','PROJECT_RESOURCE_FILE','LESSON_VIDEO')),
	CONSTRAINT "storage_file_events_event_type_ck" CHECK ("storage_file_events"."event_type" in ('UPLOAD_GRANTED','UPLOAD_COMPLETED','UPLOAD_FAILED','SCAN_ATTESTED','SCAN_REJECTED','DOWNLOAD_GRANTED','PLAYBACK_GRANTED','THUMBNAIL_GRANTED','THUMBNAIL_COMPLETED','SUBMITTED','UPDATED','PUBLISHED','UNPUBLISHED','REPLACED','DELETED')),
	CONSTRAINT "storage_file_events_detail_ck" CHECK (jsonb_typeof("storage_file_events"."detail") = 'object')
);
--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_submissions_id_assignment_member_uq" ON "assignment_submissions" USING btree ("id","assignment_id","membership_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "project_instances_id_college_uq" ON "project_instances" USING btree ("id","college_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "project_resources_id_project_uq" ON "project_resources" USING btree ("id","project_id");
--> statement-breakpoint
ALTER TABLE "assignment_submissions" DROP CONSTRAINT "assignment_submissions_payload_ck";
--> statement-breakpoint
ALTER TABLE "assignment_submission_files" ADD CONSTRAINT "assignment_submission_files_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assignment_submission_files" ADD CONSTRAINT "assignment_submission_files_assignment_id_course_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."course_assignments"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assignment_submission_files" ADD CONSTRAINT "assignment_submission_files_delivery_id_course_section_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."course_section_deliveries"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assignment_submission_files" ADD CONSTRAINT "assignment_submission_files_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assignment_submission_files" ADD CONSTRAINT "assignment_submission_files_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assignment_submission_files" ADD CONSTRAINT "assignment_submission_files_owner_college_fk" FOREIGN KEY ("owner_membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assignment_submission_files" ADD CONSTRAINT "assignment_submission_files_submission_scope_fk" FOREIGN KEY ("submission_id","assignment_id","owner_membership_id") REFERENCES "public"."assignment_submissions"("id","assignment_id","membership_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_video_assets" ADD CONSTRAINT "lesson_video_assets_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_video_assets" ADD CONSTRAINT "lesson_video_assets_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_video_assets" ADD CONSTRAINT "lesson_video_assets_delivery_id_course_section_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."course_section_deliveries"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_video_assets" ADD CONSTRAINT "lesson_video_assets_lesson_content_id_lesson_contents_id_fk" FOREIGN KEY ("lesson_content_id") REFERENCES "public"."lesson_contents"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_video_assets" ADD CONSTRAINT "lesson_video_assets_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_video_assets" ADD CONSTRAINT "lesson_video_assets_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_video_assets" ADD CONSTRAINT "lesson_video_assets_uploader_college_fk" FOREIGN KEY ("uploader_membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_video_assets" ADD CONSTRAINT "lesson_video_assets_replaces_fk" FOREIGN KEY ("replaces_asset_id") REFERENCES "public"."lesson_video_assets"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_resource_files" ADD CONSTRAINT "project_resource_files_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_resource_files" ADD CONSTRAINT "project_resource_files_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_resource_files" ADD CONSTRAINT "project_resource_files_deleted_by_user_id_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_resource_files" ADD CONSTRAINT "project_resource_files_project_college_fk" FOREIGN KEY ("project_id","college_id") REFERENCES "public"."project_instances"("id","college_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_resource_files" ADD CONSTRAINT "project_resource_files_resource_project_fk" FOREIGN KEY ("resource_id","project_id") REFERENCES "public"."project_resources"("id","project_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_resource_files" ADD CONSTRAINT "project_resource_files_uploader_college_fk" FOREIGN KEY ("uploader_membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "storage_file_events" ADD CONSTRAINT "storage_file_events_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "storage_file_events" ADD CONSTRAINT "storage_file_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "storage_file_events" ADD CONSTRAINT "storage_file_events_actor_membership_college_fk" FOREIGN KEY ("actor_membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_submission_files_object_key_uq" ON "assignment_submission_files" USING btree ("object_key");
--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_submission_files_submission_sequence_uq" ON "assignment_submission_files" USING btree ("submission_id","sequence") WHERE "assignment_submission_files"."submission_id" is not null and "assignment_submission_files"."status" <> 'DELETED';
--> statement-breakpoint
CREATE INDEX "assignment_submission_files_owner_assignment_idx" ON "assignment_submission_files" USING btree ("owner_membership_id","assignment_id","delivery_id");
--> statement-breakpoint
CREATE INDEX "assignment_submission_files_submission_idx" ON "assignment_submission_files" USING btree ("submission_id");
--> statement-breakpoint
CREATE INDEX "assignment_submission_files_college_status_idx" ON "assignment_submission_files" USING btree ("college_id","status");
--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_video_assets_object_key_uq" ON "lesson_video_assets" USING btree ("object_key");
--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_video_assets_thumbnail_key_uq" ON "lesson_video_assets" USING btree ("thumbnail_object_key") WHERE "lesson_video_assets"."thumbnail_object_key" is not null;
--> statement-breakpoint
CREATE INDEX "lesson_video_assets_lesson_delivery_idx" ON "lesson_video_assets" USING btree ("lesson_id","delivery_id","sequence");
--> statement-breakpoint
CREATE INDEX "lesson_video_assets_content_idx" ON "lesson_video_assets" USING btree ("lesson_content_id");
--> statement-breakpoint
CREATE INDEX "lesson_video_assets_college_status_idx" ON "lesson_video_assets" USING btree ("college_id","processing_status");
--> statement-breakpoint
CREATE UNIQUE INDEX "project_resource_files_object_key_uq" ON "project_resource_files" USING btree ("object_key");
--> statement-breakpoint
CREATE INDEX "project_resource_files_project_status_idx" ON "project_resource_files" USING btree ("project_id","status");
--> statement-breakpoint
CREATE INDEX "project_resource_files_resource_idx" ON "project_resource_files" USING btree ("resource_id");
--> statement-breakpoint
CREATE INDEX "project_resource_files_college_status_idx" ON "project_resource_files" USING btree ("college_id","status");
--> statement-breakpoint
CREATE INDEX "storage_file_events_subject_idx" ON "storage_file_events" USING btree ("subject_kind","subject_id","occurred_at");
--> statement-breakpoint
CREATE INDEX "storage_file_events_college_time_idx" ON "storage_file_events" USING btree ("college_id","occurred_at");
--> statement-breakpoint
CREATE INDEX "storage_file_events_actor_idx" ON "storage_file_events" USING btree ("actor_user_id","occurred_at");
--> statement-breakpoint
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
        (("assignment_submissions"."submission_type")::text = 'FILE'
          and "assignment_submissions"."text_content" is null
          and "assignment_submissions"."submission_url" is null)
      ));
--> statement-breakpoint
CREATE FUNCTION "assignment_file_submission_requires_file"() RETURNS trigger AS $$
BEGIN
	IF NEW."submission_type" = 'FILE' AND NOT EXISTS (
		SELECT 1 FROM "assignment_submission_files" f
		WHERE f."submission_id" = NEW."id" AND f."status" = 'READY'
	) THEN
		RAISE EXCEPTION 'FILE submission % requires at least one READY file', NEW."id"
			USING ERRCODE = '23514', CONSTRAINT = 'assignment_submissions_file_required_trg';
	END IF;
	RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER "assignment_submissions_file_required_trg"
	AFTER INSERT ON "assignment_submissions"
	DEFERRABLE INITIALLY DEFERRED
	FOR EACH ROW EXECUTE FUNCTION "assignment_file_submission_requires_file"();

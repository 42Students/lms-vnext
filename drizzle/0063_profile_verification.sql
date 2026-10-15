CREATE TABLE "profile_private_document_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owning_membership_id" uuid NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"related_entry_id" uuid,
	"private_object_key" text NOT NULL,
	"object_generation" varchar(80) NOT NULL,
	"sha256_hex" varchar(64) NOT NULL,
	"mime_type" varchar(128) NOT NULL,
	"size_bytes" bigint NOT NULL,
	"scan_status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"uploaded_by_user_id" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"retention_until" timestamp with time zone,
	CONSTRAINT "profile_private_doc_purpose_ck" CHECK ("profile_private_document_receipts"."purpose" in ('AADHAAR','PAN','MARKSHEET','RESUME','PROFILE_IMAGE','EDUCATION_CERTIFICATE','CERTIFICATION','EXPERIENCE_CERTIFICATE','OFFER_LETTER')),
	CONSTRAINT "profile_private_doc_scan_ck" CHECK ("profile_private_document_receipts"."scan_status" in ('PENDING','CLEAN','REJECTED')),
	CONSTRAINT "profile_private_doc_size_ck" CHECK ("profile_private_document_receipts"."size_bytes" > 0 and "profile_private_document_receipts"."size_bytes" <= 26214400),
	CONSTRAINT "profile_private_doc_object_key_ck" CHECK ("profile_private_document_receipts"."private_object_key" ~ '^private/[A-Za-z0-9_/-]+$'
      and position('..' in "profile_private_document_receipts"."private_object_key") = 0
      and position('://' in "profile_private_document_receipts"."private_object_key") = 0),
	CONSTRAINT "profile_private_doc_generation_ck" CHECK ("profile_private_document_receipts"."object_generation" ~ '^[0-9]+$'),
	CONSTRAINT "profile_private_doc_sha256_ck" CHECK ("profile_private_document_receipts"."sha256_hex" ~ '^[0-9A-Fa-f]{64}$'),
	CONSTRAINT "profile_private_doc_mimetype_ck" CHECK (char_length(trim("profile_private_document_receipts"."mime_type")) > 0),
	CONSTRAINT "profile_private_doc_retention_ck" CHECK ("profile_private_document_receipts"."retention_until" is null or "profile_private_document_receipts"."retention_until" >= "profile_private_document_receipts"."uploaded_at"),
	CONSTRAINT "profile_private_doc_revocation_ck" CHECK ("profile_private_document_receipts"."revoked_at" is null or "profile_private_document_receipts"."revoked_at" >= "profile_private_document_receipts"."uploaded_at")
);
--> statement-breakpoint
CREATE TABLE "profile_verification_academic_marks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verification_id" uuid NOT NULL,
	"learner_membership_id" uuid NOT NULL,
	"level" varchar(16) NOT NULL,
	"original_grade" varchar(64) NOT NULL,
	"original_scale" varchar(32),
	"original_max" varchar(32),
	"percentage_basis_points" integer,
	"applied_rule" varchar(24) NOT NULL,
	"source_snapshot_version" integer NOT NULL,
	"verified_by_user_id" uuid NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_verification_academic_marks_level_ck" CHECK ("profile_verification_academic_marks"."level" in ('10TH','12TH','DIPLOMA','UG','PG')),
	CONSTRAINT "profile_verification_academic_marks_percentage_ck" CHECK ("profile_verification_academic_marks"."percentage_basis_points" is null or "profile_verification_academic_marks"."percentage_basis_points" between 0 and 10000),
	CONSTRAINT "profile_verification_academic_marks_revision_ck" CHECK ("profile_verification_academic_marks"."source_snapshot_version" > 0),
	CONSTRAINT "profile_verification_academic_marks_rule_ck" CHECK ("profile_verification_academic_marks"."applied_rule" in
    ('X9_5','MINUS_0_5_X10','MINUS_0_75_X10','X10'))
);
--> statement-breakpoint
CREATE TABLE "profile_verification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"verification_id" uuid NOT NULL,
	"action" varchar(20) NOT NULL,
	"actor_kind" varchar(20) NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"actor_name" varchar(200),
	"note" varchar(500),
	"snapshot" jsonb,
	"prior_version" integer NOT NULL,
	"next_version" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_verification_events_action_ck" CHECK ("profile_verification_events"."action" in ('SUBMITTED','UPDATE_SUBMITTED','VERIFIED','SENT_BACK')),
	CONSTRAINT "profile_verification_events_actor_ck" CHECK ("profile_verification_events"."actor_kind" in ('LEARNER','COLLEGE_ADMIN','SUPER_ADMIN','TPO')),
	CONSTRAINT "profile_verification_events_revision_ck" CHECK ("profile_verification_events"."prior_version" >= 0 and "profile_verification_events"."next_version" = "profile_verification_events"."prior_version" + 1),
	CONSTRAINT "profile_verification_events_sendback_reason_ck" CHECK ("profile_verification_events"."action" != 'SENT_BACK' or ("profile_verification_events"."note" is not null and char_length(trim("profile_verification_events"."note")) >= 3))
);
--> statement-breakpoint
CREATE TABLE "profile_verification_settings" (
	"college_id" uuid PRIMARY KEY NOT NULL,
	"tpo_can_verify_profiles" boolean DEFAULT true NOT NULL,
	"cgpa_to_pct" varchar(24) DEFAULT 'X9_5' NOT NULL,
	"updated_by_user_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_verification_settings_rule_ck" CHECK ("profile_verification_settings"."cgpa_to_pct" in
    ('X9_5','MINUS_0_5_X10','MINUS_0_75_X10','X10'))
);
--> statement-breakpoint
CREATE TABLE "profile_verification_tpo_grants" (
	"membership_id" uuid PRIMARY KEY NOT NULL,
	"granted_by_user_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "profile_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_membership_id" uuid NOT NULL,
	"section" varchar(16) NOT NULL,
	"status" varchar(20) NOT NULL,
	"submitted_snapshot" jsonb NOT NULL,
	"verified_snapshot" jsonb,
	"submitted_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"decided_by_user_id" uuid,
	"decided_by_name" varchar(200),
	"note" varchar(500),
	"row_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_verifications_section_ck" CHECK ("profile_verifications"."section" in ('EDUCATION','IDENTITY')),
	CONSTRAINT "profile_verifications_status_ck" CHECK ("profile_verifications"."status" in ('SUBMITTED','SENT_BACK','VERIFIED','UPDATE_PENDING')),
	CONSTRAINT "profile_verifications_row_version_ck" CHECK ("profile_verifications"."row_version" >= 1),
	CONSTRAINT "profile_verifications_verified_state_ck" CHECK ("profile_verifications"."status" not in ('VERIFIED','UPDATE_PENDING') or
      ("profile_verifications"."verified_snapshot" is not null and "profile_verifications"."verified_at" is not null)),
	CONSTRAINT "profile_verifications_send_back_note_ck" CHECK ("profile_verifications"."status" != 'SENT_BACK' or ("profile_verifications"."note" is not null and char_length(trim("profile_verifications"."note")) >= 3))
);
--> statement-breakpoint
ALTER TABLE "profile_private_document_receipts" ADD CONSTRAINT "profile_private_document_receipts_owning_membership_id_college_memberships_id_fk" FOREIGN KEY ("owning_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_private_document_receipts" ADD CONSTRAINT "profile_private_document_receipts_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_verification_academic_marks" ADD CONSTRAINT "profile_verification_academic_marks_learner_membership_id_college_memberships_id_fk" FOREIGN KEY ("learner_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_verification_academic_marks" ADD CONSTRAINT "profile_verification_academic_marks_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "profile_verifications_id_member_uq" ON "profile_verifications" USING btree ("id","learner_membership_id");--> statement-breakpoint
ALTER TABLE "profile_verification_academic_marks" ADD CONSTRAINT "profile_verification_academic_marks_parent_fk" FOREIGN KEY ("verification_id","learner_membership_id") REFERENCES "public"."profile_verifications"("id","learner_membership_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_verification_events" ADD CONSTRAINT "profile_verification_events_verification_id_profile_verifications_id_fk" FOREIGN KEY ("verification_id") REFERENCES "public"."profile_verifications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_verification_events" ADD CONSTRAINT "profile_verification_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_verification_settings" ADD CONSTRAINT "profile_verification_settings_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_verification_settings" ADD CONSTRAINT "profile_verification_settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_verification_tpo_grants" ADD CONSTRAINT "profile_verification_tpo_grants_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_verification_tpo_grants" ADD CONSTRAINT "profile_verification_tpo_grants_granted_by_user_id_users_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_verifications" ADD CONSTRAINT "profile_verifications_learner_membership_id_college_memberships_id_fk" FOREIGN KEY ("learner_membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_verifications" ADD CONSTRAINT "profile_verifications_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profile_private_doc_member_purpose_idx" ON "profile_private_document_receipts" USING btree ("owning_membership_id","purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_private_doc_generation_uq" ON "profile_private_document_receipts" USING btree ("private_object_key","object_generation");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_private_doc_id_owner_uq" ON "profile_private_document_receipts" USING btree ("id","owning_membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_private_doc_id_owner_purpose_uq" ON "profile_private_document_receipts" USING btree ("id","owning_membership_id","purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_verification_academic_marks_level_uq" ON "profile_verification_academic_marks" USING btree ("learner_membership_id","level");--> statement-breakpoint
CREATE INDEX "profile_verification_academic_marks_verification_idx" ON "profile_verification_academic_marks" USING btree ("verification_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_verification_events_revision_uq" ON "profile_verification_events" USING btree ("verification_id","next_version");--> statement-breakpoint
CREATE INDEX "profile_verification_events_created_idx" ON "profile_verification_events" USING btree ("verification_id","created_at");--> statement-breakpoint
CREATE INDEX "profile_verification_tpo_grants_revoked_idx" ON "profile_verification_tpo_grants" USING btree ("revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_verifications_learner_section_uq" ON "profile_verifications" USING btree ("learner_membership_id","section");--> statement-breakpoint
CREATE INDEX "profile_verifications_status_section_idx" ON "profile_verifications" USING btree ("status","section");--> statement-breakpoint
CREATE INDEX "profile_verifications_learner_status_idx" ON "profile_verifications" USING btree ("learner_membership_id","status");
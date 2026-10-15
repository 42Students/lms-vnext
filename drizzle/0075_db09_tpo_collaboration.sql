CREATE TABLE "placement_recruiter_applicant_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recruiter_user_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"rating" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_recruiter_applicant_notes_rating_ck" CHECK ("placement_recruiter_applicant_notes"."rating" is null or "placement_recruiter_applicant_notes"."rating" between 1 and 5),
	CONSTRAINT "placement_recruiter_applicant_notes_content_ck" CHECK ("placement_recruiter_applicant_notes"."rating" is not null or length(trim(coalesce("placement_recruiter_applicant_notes"."note", ''))) > 0),
	CONSTRAINT "placement_recruiter_applicant_notes_note_ck" CHECK ("placement_recruiter_applicant_notes"."note" is null or length("placement_recruiter_applicant_notes"."note") <= 1000)
);
--> statement-breakpoint
CREATE TABLE "placement_recruiter_notification_reads" (
	"recruiter_user_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	"read_through" timestamp with time zone NOT NULL,
	CONSTRAINT "placement_recruiter_notification_reads_pk" PRIMARY KEY("recruiter_user_id","college_id")
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_college_settings" (
	"college_id" uuid PRIMARY KEY NOT NULL,
	"invite_email_template" text,
	"reminder_email_template" text,
	"whatsapp_template" text,
	"student_email_wording" text,
	"sms_monthly_cap" integer DEFAULT 500 NOT NULL,
	"email_signature" text,
	"logo_object_path" text,
	"prep_threshold_pct" integer DEFAULT 60 NOT NULL,
	"notify_drive_open_email" boolean DEFAULT true NOT NULL,
	"notify_result_applied" boolean DEFAULT true NOT NULL,
	"notify_nudges" boolean DEFAULT true NOT NULL,
	"notify_prep_assigned" boolean DEFAULT true NOT NULL,
	"job_types" jsonb,
	"outcome_labels" jsonb,
	"recruiter_access_months" integer DEFAULT 6 NOT NULL,
	"recruiter_drive_needs_approval" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_college_settings_bounds_ck" CHECK ("placement_tpo_college_settings"."sms_monthly_cap" >= 0
        and "placement_tpo_college_settings"."prep_threshold_pct" between 0 and 100
        and "placement_tpo_college_settings"."recruiter_access_months" between 0 and 60),
	CONSTRAINT "placement_tpo_college_settings_job_types_ck" CHECK ("placement_tpo_college_settings"."job_types" is null or jsonb_typeof("placement_tpo_college_settings"."job_types") = 'object'),
	CONSTRAINT "placement_tpo_college_settings_outcome_labels_ck" CHECK ("placement_tpo_college_settings"."outcome_labels" is null or jsonb_typeof("placement_tpo_college_settings"."outcome_labels") = 'array')
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_message_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"recruiter_user_id" uuid NOT NULL,
	"job_id" uuid,
	"last_message_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_type" varchar(10) NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_messages_sender_ck" CHECK ("placement_tpo_messages"."sender_type" in ('TPO', 'RECRUITER')),
	CONSTRAINT "placement_tpo_messages_body_ck" CHECK (length(trim("placement_tpo_messages"."body")) between 1 and 4000)
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_prep_courses" (
	"college_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_prep_courses_pk" PRIMARY KEY("college_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_saved_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"filters" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_saved_views_scope_ck" CHECK ("placement_tpo_saved_views"."scope" in (
        'STUDENTS',
        'RECRUITER_LEADS',
        'DRIVES',
        'APPLICANTS',
        'BATCH_STUDENTS',
        'OFFERS',
        'REQUESTS',
        'AUDIT',
        'REPORT',
        'VERIFICATION',
        'RESULTS',
        'COMPANY_DRIVES'
      )),
	CONSTRAINT "placement_tpo_saved_views_name_ck" CHECK (length(trim("placement_tpo_saved_views"."name")) between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_share_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"share_id" uuid NOT NULL,
	"action" varchar(24) NOT NULL,
	"detail" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_share_events_action_ck" CHECK ("placement_tpo_share_events"."action" in ('CREATED','OPENED','DOWNLOADED_LIST','DOWNLOADED_ZIP','REVOKED','LINK_EMAILED','CODE_EMAILED'))
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_share_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"recipient_email" varchar(320) NOT NULL,
	"code_hash" varchar(64),
	"email_code_hash" varchar(64),
	"email_code_expires_at" timestamp with time zone,
	"columns" jsonb,
	"max_stage" varchar(30),
	"shortlist_by" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_share_links_token_hash_ck" CHECK ("placement_tpo_share_links"."token_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "placement_tpo_share_links_code_hash_ck" CHECK ("placement_tpo_share_links"."code_hash" is null or "placement_tpo_share_links"."code_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "placement_tpo_share_links_email_code_hash_ck" CHECK ("placement_tpo_share_links"."email_code_hash" is null or "placement_tpo_share_links"."email_code_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "placement_tpo_share_links_expiry_ck" CHECK ("placement_tpo_share_links"."expires_at" > "placement_tpo_share_links"."created_at"),
	CONSTRAINT "placement_tpo_share_links_email_code_shape_ck" CHECK (("placement_tpo_share_links"."email_code_hash" is null and "placement_tpo_share_links"."email_code_expires_at" is null)
        or ("placement_tpo_share_links"."email_code_hash" is not null and "placement_tpo_share_links"."email_code_expires_at" is not null)),
	CONSTRAINT "placement_tpo_share_links_recipient_email_ck" CHECK ("placement_tpo_share_links"."recipient_email" = lower(trim("placement_tpo_share_links"."recipient_email"))
        and position('@' in "placement_tpo_share_links"."recipient_email") > 1),
	CONSTRAINT "placement_tpo_share_links_columns_ck" CHECK ("placement_tpo_share_links"."columns" is null
        or (
          jsonb_typeof("placement_tpo_share_links"."columns") = 'array'
          and "placement_tpo_share_links"."columns" <@
            '["name","roll","branch","cgpa","tenth","twelfth","email","phone","resume","projects","skillMatch","stage"]'::jsonb
        )),
	CONSTRAINT "placement_tpo_share_links_max_stage_ck" CHECK ("placement_tpo_share_links"."max_stage" is null
        or "placement_tpo_share_links"."max_stage" in (
          'APPLIED','SHORTLISTED','ASSESSMENT','INTERVIEW','OFFERED','HIRED'
        )),
	CONSTRAINT "placement_tpo_share_links_revocation_ck" CHECK ("placement_tpo_share_links"."revoked_at" is null or "placement_tpo_share_links"."revoked_at" >= "placement_tpo_share_links"."created_at"),
	CONSTRAINT "placement_tpo_share_links_email_code_expiry_ck" CHECK ("placement_tpo_share_links"."email_code_expires_at" is null
        or "placement_tpo_share_links"."email_code_expires_at" > "placement_tpo_share_links"."created_at")
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_student_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"learner_membership_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_student_notes_note_ck" CHECK (length(trim("placement_tpo_student_notes"."note")) between 1 and 2000)
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"college_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"role" varchar(32) NOT NULL,
	"department_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_team_members_role_ck" CHECK ("placement_tpo_team_members"."role" in ('TPO_ADMIN','FACULTY_COORDINATOR')),
	CONSTRAINT "placement_tpo_team_members_department_ck" CHECK (("placement_tpo_team_members"."role" = 'TPO_ADMIN' and "placement_tpo_team_members"."department_id" is null)
        or ("placement_tpo_team_members"."role" = 'FACULTY_COORDINATOR' and "placement_tpo_team_members"."department_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_trusted_domains" (
	"college_id" uuid NOT NULL,
	"domain" varchar(253) NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_trusted_domains_pk" PRIMARY KEY("college_id","domain"),
	CONSTRAINT "placement_tpo_trusted_domains_shape_ck" CHECK ("placement_tpo_trusted_domains"."domain" = lower("placement_tpo_trusted_domains"."domain")
        and "placement_tpo_trusted_domains"."domain" = trim("placement_tpo_trusted_domains"."domain")
        and "placement_tpo_trusted_domains"."domain" ~ '^[a-z0-9.-]+[.][a-z]{2,}$'
),
	CONSTRAINT "placement_tpo_trusted_domains_free_mail_ck" CHECK ("placement_tpo_trusted_domains"."domain" not in (
        'gmail.com','googlemail.com',
        'yahoo.com','yahoo.co.in','yahoo.in','ymail.com',
        'outlook.com','outlook.in','hotmail.com','live.com','msn.com',
        'icloud.com','me.com','aol.com','rediffmail.com',
        'protonmail.com','proton.me',
        'zohomail.com','zohomail.in','mail.com','gmx.com','yandex.com'
      ))
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_user_preferences" (
	"college_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"morning_digest" boolean DEFAULT false NOT NULL,
	"recruiter_messages" boolean DEFAULT true NOT NULL,
	"requests" boolean DEFAULT true NOT NULL,
	"results_ready" boolean DEFAULT true NOT NULL,
	"follow_ups" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_tpo_user_preferences_pk" PRIMARY KEY("college_id","user_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "departments_id_college_uq" ON "departments" USING btree ("id","college_id");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_applications_id_job_uq" ON "placement_applications" USING btree ("id","job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_jobs_id_college_uq" ON "placement_jobs" USING btree ("id","college_id");--> statement-breakpoint
ALTER TABLE "placement_recruiter_applicant_notes" ADD CONSTRAINT "placement_recruiter_applicant_notes_recruiter_user_id_placement_recruiter_profiles_user_id_fk" FOREIGN KEY ("recruiter_user_id") REFERENCES "public"."placement_recruiter_profiles"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_recruiter_applicant_notes" ADD CONSTRAINT "placement_recruiter_applicant_notes_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_recruiter_applicant_notes" ADD CONSTRAINT "db09_recruiter_note_job_scope_fk" FOREIGN KEY ("job_id","college_id") REFERENCES "public"."placement_jobs"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_recruiter_applicant_notes" ADD CONSTRAINT "db09_recruiter_note_application_job_fk" FOREIGN KEY ("application_id","job_id") REFERENCES "public"."placement_applications"("id","job_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_recruiter_notification_reads" ADD CONSTRAINT "placement_recruiter_notification_reads_recruiter_user_id_placement_recruiter_profiles_user_id_fk" FOREIGN KEY ("recruiter_user_id") REFERENCES "public"."placement_recruiter_profiles"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_recruiter_notification_reads" ADD CONSTRAINT "placement_recruiter_notification_reads_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_college_settings" ADD CONSTRAINT "placement_tpo_college_settings_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_message_threads" ADD CONSTRAINT "placement_tpo_message_threads_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_message_threads" ADD CONSTRAINT "placement_tpo_message_threads_recruiter_user_id_placement_recruiter_profiles_user_id_fk" FOREIGN KEY ("recruiter_user_id") REFERENCES "public"."placement_recruiter_profiles"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_message_threads" ADD CONSTRAINT "db09_thread_job_scope_fk" FOREIGN KEY ("job_id","college_id") REFERENCES "public"."placement_jobs"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_messages" ADD CONSTRAINT "placement_tpo_messages_thread_id_placement_tpo_message_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."placement_tpo_message_threads"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_messages" ADD CONSTRAINT "placement_tpo_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_prep_courses" ADD CONSTRAINT "placement_tpo_prep_courses_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_prep_courses" ADD CONSTRAINT "placement_tpo_prep_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_prep_courses" ADD CONSTRAINT "placement_tpo_prep_courses_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_saved_views" ADD CONSTRAINT "placement_tpo_saved_views_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_saved_views" ADD CONSTRAINT "placement_tpo_saved_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_share_events" ADD CONSTRAINT "placement_tpo_share_events_share_id_placement_tpo_share_links_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."placement_tpo_share_links"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_share_links" ADD CONSTRAINT "placement_tpo_share_links_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_share_links" ADD CONSTRAINT "placement_tpo_share_links_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_share_links" ADD CONSTRAINT "db09_share_job_scope_fk" FOREIGN KEY ("job_id","college_id") REFERENCES "public"."placement_jobs"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_student_notes" ADD CONSTRAINT "placement_tpo_student_notes_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_student_notes" ADD CONSTRAINT "placement_tpo_student_notes_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_student_notes" ADD CONSTRAINT "db09_note_member_scope_fk" FOREIGN KEY ("learner_membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_team_members" ADD CONSTRAINT "placement_tpo_team_members_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_team_members" ADD CONSTRAINT "db09_team_member_scope_fk" FOREIGN KEY ("membership_id","college_id") REFERENCES "public"."college_memberships"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_team_members" ADD CONSTRAINT "db09_team_department_scope_fk" FOREIGN KEY ("department_id","college_id") REFERENCES "public"."departments"("id","college_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_trusted_domains" ADD CONSTRAINT "placement_tpo_trusted_domains_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_trusted_domains" ADD CONSTRAINT "placement_tpo_trusted_domains_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_user_preferences" ADD CONSTRAINT "placement_tpo_user_preferences_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_user_preferences" ADD CONSTRAINT "placement_tpo_user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_recruiter_applicant_notes_owner_application_uq" ON "placement_recruiter_applicant_notes" USING btree ("recruiter_user_id","application_id");--> statement-breakpoint
CREATE INDEX "placement_recruiter_applicant_notes_owner_job_idx" ON "placement_recruiter_applicant_notes" USING btree ("recruiter_user_id","job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_message_threads_general_uq" ON "placement_tpo_message_threads" USING btree ("college_id","recruiter_user_id") WHERE "placement_tpo_message_threads"."job_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_message_threads_job_uq" ON "placement_tpo_message_threads" USING btree ("college_id","recruiter_user_id","job_id") WHERE "placement_tpo_message_threads"."job_id" is not null;--> statement-breakpoint
CREATE INDEX "placement_tpo_message_threads_college_last_idx" ON "placement_tpo_message_threads" USING btree ("college_id","last_message_at");--> statement-breakpoint
CREATE INDEX "placement_tpo_messages_thread_created_idx" ON "placement_tpo_messages" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "placement_tpo_prep_courses_course_idx" ON "placement_tpo_prep_courses" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "placement_tpo_saved_views_owner_scope_idx" ON "placement_tpo_saved_views" USING btree ("college_id","user_id","scope");--> statement-breakpoint
CREATE INDEX "placement_tpo_share_events_share_created_idx" ON "placement_tpo_share_events" USING btree ("share_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "db09_share_events_created_uq" ON "placement_tpo_share_events" USING btree ("share_id") WHERE "placement_tpo_share_events"."action" = 'CREATED';--> statement-breakpoint
CREATE UNIQUE INDEX "db09_share_events_revoked_uq" ON "placement_tpo_share_events" USING btree ("share_id") WHERE "placement_tpo_share_events"."action" = 'REVOKED';--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_share_links_token_uq" ON "placement_tpo_share_links" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "placement_tpo_share_links_job_created_idx" ON "placement_tpo_share_links" USING btree ("job_id","created_at");--> statement-breakpoint
CREATE INDEX "placement_tpo_share_links_college_created_idx" ON "placement_tpo_share_links" USING btree ("college_id","created_at");--> statement-breakpoint
CREATE INDEX "placement_tpo_student_notes_learner_created_idx" ON "placement_tpo_student_notes" USING btree ("learner_membership_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "placement_tpo_team_members_college_membership_uq" ON "placement_tpo_team_members" USING btree ("college_id","membership_id");--> statement-breakpoint
CREATE INDEX "placement_tpo_trusted_domains_domain_idx" ON "placement_tpo_trusted_domains" USING btree ("domain");--> statement-breakpoint
CREATE FUNCTION db09_has_active_college_membership(
  p_user_id uuid,
  p_college_id uuid
) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
      FROM college_memberships m
      JOIN users u ON u.id = m.user_id
      JOIN colleges c ON c.id = m.college_id
     WHERE m.user_id = p_user_id
       AND m.college_id = p_college_id
       AND m.status = 'ACTIVE'
       AND u.platform_status = 'ACTIVE'
       AND c.status = 'ACTIVE'
  );
$$;
--> statement-breakpoint
CREATE FUNCTION db09_has_active_tpo_actor(
  p_user_id uuid,
  p_college_id uuid
) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
      FROM college_memberships m
      JOIN users u ON u.id = m.user_id
      JOIN colleges c ON c.id = m.college_id
     WHERE m.user_id = p_user_id
       AND m.college_id = p_college_id
       AND m.status = 'ACTIVE'
       AND u.platform_status = 'ACTIVE'
       AND c.status = 'ACTIVE'
       AND EXISTS (
         SELECT 1
           FROM membership_roles r
          WHERE r.membership_id = m.id
            AND r.role IN ('TPO','COLLEGE_ADMIN')
       )
  );
$$;
--> statement-breakpoint
CREATE FUNCTION db09_has_active_recruiter_grant(
  p_recruiter_user_id uuid,
  p_college_id uuid,
  p_company_relationship_id uuid DEFAULT NULL
) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
      FROM placement_recruiter_college_grants g
      JOIN placement_company_relationships r
        ON r.id = g.company_relationship_id
      JOIN placement_recruiter_profiles p
        ON p.user_id = g.recruiter_user_id
      JOIN placement_companies co
        ON co.id = p.company_id
      JOIN users u
        ON u.id = p.user_id
      JOIN colleges c
        ON c.id = r.college_id
     WHERE g.recruiter_user_id = p_recruiter_user_id
       AND g.status = 'ACTIVE'
       AND r.status = 'ACTIVE'
       AND p.status = 'ACTIVE'
       AND co.status = 'ACTIVE'
       AND u.platform_status = 'ACTIVE'
       AND c.status = 'ACTIVE'
       AND r.college_id = p_college_id
       AND r.company_id = p.company_id
       AND (
         p_company_relationship_id IS NULL
         OR r.id = p_company_relationship_id
       )
  );
$$;
--> statement-breakpoint
CREATE FUNCTION db09_assert_message_thread_principal_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_job_relationship uuid;
BEGIN
  IF NEW.job_id IS NOT NULL THEN
    SELECT company_relationship_id
      INTO v_job_relationship
      FROM placement_jobs
     WHERE id = NEW.job_id
       AND college_id = NEW.college_id;
    IF v_job_relationship IS NULL THEN
      RAISE EXCEPTION 'message thread job is outside the thread college'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NOT db09_has_active_recruiter_grant(
    NEW.recruiter_user_id,
    NEW.college_id,
    v_job_relationship
  ) THEN
    RAISE EXCEPTION 'message thread recruiter has no active matching college grant'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_message_thread_principal_scope_guard
  BEFORE INSERT OR UPDATE OF college_id,recruiter_user_id,job_id
  ON placement_tpo_message_threads
  FOR EACH ROW EXECUTE FUNCTION db09_assert_message_thread_principal_scope();
--> statement-breakpoint
CREATE FUNCTION db09_restrict_message_thread_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'message thread history is append-only'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.college_id IS DISTINCT FROM OLD.college_id
     OR NEW.recruiter_user_id IS DISTINCT FROM OLD.recruiter_user_id
     OR NEW.job_id IS DISTINCT FROM OLD.job_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'message thread identity is immutable'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_message_thread_update_guard
  BEFORE UPDATE OR DELETE ON placement_tpo_message_threads
  FOR EACH ROW EXECUTE FUNCTION db09_restrict_message_thread_update();
--> statement-breakpoint
CREATE FUNCTION db09_assert_message_sender_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_college_id uuid;
  v_recruiter_user_id uuid;
BEGIN
  SELECT college_id,recruiter_user_id
    INTO v_college_id,v_recruiter_user_id
    FROM placement_tpo_message_threads
   WHERE id = NEW.thread_id;

  IF v_college_id IS NULL THEN
    RAISE EXCEPTION 'message thread does not exist'
      USING ERRCODE = '23503';
  END IF;

  IF NEW.read_at IS NOT NULL THEN
    RAISE EXCEPTION 'new message must start unread'
      USING ERRCODE = '23514';
  END IF;
  IF NEW.created_at > statement_timestamp() + interval '5 minutes' THEN
    RAISE EXCEPTION 'message creation timestamp is unreasonably future dated'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.sender_type = 'RECRUITER' THEN
    IF NEW.sender_user_id <> v_recruiter_user_id
       OR NOT db09_has_active_recruiter_grant(
         NEW.sender_user_id,
         v_college_id,
         NULL
       ) THEN
      RAISE EXCEPTION 'message recruiter sender does not own the thread'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.sender_type = 'TPO' THEN
    IF NOT db09_has_active_tpo_actor(
      NEW.sender_user_id,
      v_college_id
    ) THEN
      RAISE EXCEPTION 'message TPO sender is not active in the thread college'
        USING ERRCODE = '23514';
    END IF;
  ELSE
    RAISE EXCEPTION 'unknown message sender type'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_message_sender_scope_guard
  BEFORE INSERT ON placement_tpo_messages
  FOR EACH ROW EXECUTE FUNCTION db09_assert_message_sender_scope();
--> statement-breakpoint
CREATE FUNCTION db09_restrict_message_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'message history is append-only'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.thread_id IS DISTINCT FROM OLD.thread_id
     OR NEW.sender_type IS DISTINCT FROM OLD.sender_type
     OR NEW.sender_user_id IS DISTINCT FROM OLD.sender_user_id
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'message identity/content is immutable'
      USING ERRCODE = '23514';
  END IF;
  IF OLD.read_at IS NOT NULL
     AND NEW.read_at IS DISTINCT FROM OLD.read_at THEN
    RAISE EXCEPTION 'message read state cannot be rewound or rewritten'
      USING ERRCODE = '23514';
  END IF;
  IF OLD.read_at IS NULL AND NEW.read_at IS NOT NULL THEN
    IF NEW.read_at < OLD.created_at THEN
      RAISE EXCEPTION 'message cannot be read before it was created'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.read_at > statement_timestamp() + interval '5 minutes' THEN
      RAISE EXCEPTION 'message read timestamp is unreasonably future dated'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_message_update_guard
  BEFORE UPDATE OR DELETE ON placement_tpo_messages
  FOR EACH ROW EXECUTE FUNCTION db09_restrict_message_update();
--> statement-breakpoint
CREATE FUNCTION db09_assert_thread_last_message_projection() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_thread_id uuid;
  v_last_message_at timestamptz;
  v_max_message_at timestamptz;
BEGIN
  IF TG_TABLE_NAME = 'placement_tpo_messages' THEN
    v_thread_id := NEW.thread_id;
  ELSE
    v_thread_id := NEW.id;
  END IF;

  SELECT t.last_message_at
    INTO v_last_message_at
    FROM placement_tpo_message_threads t
   WHERE t.id = v_thread_id;

  SELECT max(m.created_at)
    INTO v_max_message_at
    FROM placement_tpo_messages m
   WHERE m.thread_id = v_thread_id;

  IF v_last_message_at IS DISTINCT FROM v_max_message_at THEN
    RAISE EXCEPTION 'message thread last_message_at does not match persisted chronology'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER db09_message_thread_projection_from_message_guard
  AFTER INSERT ON placement_tpo_messages
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION db09_assert_thread_last_message_projection();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER db09_message_thread_projection_from_thread_guard
  AFTER INSERT OR UPDATE ON placement_tpo_message_threads
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION db09_assert_thread_last_message_projection();
--> statement-breakpoint
CREATE FUNCTION db09_assert_recruiter_private_note_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_relationship uuid;
BEGIN
  SELECT company_relationship_id
    INTO v_relationship
    FROM placement_jobs
   WHERE id = NEW.job_id
     AND college_id = NEW.college_id;

  IF v_relationship IS NULL
     OR NOT db09_has_active_recruiter_grant(
       NEW.recruiter_user_id,
       NEW.college_id,
       v_relationship
     ) THEN
    RAISE EXCEPTION 'recruiter applicant note is outside recruiter grant scope'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_recruiter_private_note_scope_guard
  BEFORE INSERT OR UPDATE OF recruiter_user_id,college_id,job_id,application_id
  ON placement_recruiter_applicant_notes
  FOR EACH ROW EXECUTE FUNCTION db09_assert_recruiter_private_note_scope();
--> statement-breakpoint
CREATE FUNCTION db09_restrict_recruiter_private_note_lifecycle() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.created_at > statement_timestamp() + interval '5 minutes'
     OR NEW.updated_at > statement_timestamp() + interval '5 minutes' THEN
    RAISE EXCEPTION 'recruiter private note timestamp is unreasonably future dated'
      USING ERRCODE = '23514';
  END IF;
  IF NEW.updated_at < NEW.created_at THEN
    RAISE EXCEPTION 'recruiter private note updated_at cannot predate created_at'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.recruiter_user_id IS DISTINCT FROM OLD.recruiter_user_id
       OR NEW.college_id IS DISTINCT FROM OLD.college_id
       OR NEW.job_id IS DISTINCT FROM OLD.job_id
       OR NEW.application_id IS DISTINCT FROM OLD.application_id
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'recruiter private note identity is immutable'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.updated_at < OLD.updated_at THEN
      RAISE EXCEPTION 'recruiter private note updated_at cannot move backward'
        USING ERRCODE = '23514';
    END IF;
    IF (NEW.rating IS DISTINCT FROM OLD.rating OR NEW.note IS DISTINCT FROM OLD.note)
       AND NEW.updated_at <= OLD.updated_at THEN
      RAISE EXCEPTION 'recruiter private note content change must advance updated_at'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_recruiter_private_note_lifecycle_guard
  BEFORE INSERT OR UPDATE ON placement_recruiter_applicant_notes
  FOR EACH ROW EXECUTE FUNCTION db09_restrict_recruiter_private_note_lifecycle();
--> statement-breakpoint
CREATE FUNCTION db09_assert_recruiter_read_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT db09_has_active_recruiter_grant(
    NEW.recruiter_user_id,
    NEW.college_id,
    NULL
  ) THEN
    RAISE EXCEPTION 'recruiter notification read marker is outside grant scope'
      USING ERRCODE = '23514';
  END IF;

  -- Source producer advances this watermark to database NOW(). A future value
  -- would hide notifications that have not happened yet; a regression would
  -- make already-read feed items unread again. Neither is a valid transition.
  IF NEW.read_through > statement_timestamp() THEN
    RAISE EXCEPTION 'recruiter notification read watermark cannot be in the future'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.recruiter_user_id IS DISTINCT FROM OLD.recruiter_user_id
       OR NEW.college_id IS DISTINCT FROM OLD.college_id THEN
      RAISE EXCEPTION 'recruiter notification read marker identity is immutable'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.read_through < OLD.read_through THEN
      RAISE EXCEPTION 'recruiter notification read watermark cannot move backward'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_recruiter_read_scope_guard
  BEFORE INSERT OR UPDATE
  ON placement_recruiter_notification_reads
  FOR EACH ROW EXECUTE FUNCTION db09_assert_recruiter_read_scope();
--> statement-breakpoint
CREATE FUNCTION db09_assert_share_creator_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT db09_has_active_tpo_actor(
    NEW.created_by_user_id,
    NEW.college_id
  ) THEN
    RAISE EXCEPTION 'share creator lacks active TPO scope in share college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_share_creator_scope_guard
  BEFORE INSERT OR UPDATE OF college_id,created_by_user_id
  ON placement_tpo_share_links
  FOR EACH ROW EXECUTE FUNCTION db09_assert_share_creator_scope();
--> statement-breakpoint
CREATE FUNCTION db09_restrict_share_link_update() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_code_rotated boolean;
  v_revoked_now boolean;
BEGIN
  -- The source creation call snapshots the disclosure contract. Subsequent
  -- source mutations only rotate the emailed verification code or revoke the
  -- link. Direct SQL must not change who/what the existing token discloses.
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.college_id IS DISTINCT FROM OLD.college_id
     OR NEW.job_id IS DISTINCT FROM OLD.job_id
     OR NEW.token_hash IS DISTINCT FROM OLD.token_hash
     OR NEW.recipient_email IS DISTINCT FROM OLD.recipient_email
     OR NEW.code_hash IS DISTINCT FROM OLD.code_hash
     OR NEW.columns IS DISTINCT FROM OLD.columns
     OR NEW.max_stage IS DISTINCT FROM OLD.max_stage
     OR NEW.shortlist_by IS DISTINCT FROM OLD.shortlist_by
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     OR NEW.created_by_user_id IS DISTINCT FROM OLD.created_by_user_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'secure share disclosure contract is immutable after creation'
      USING ERRCODE = '23514';
  END IF;

  v_code_rotated :=
    NEW.email_code_hash IS DISTINCT FROM OLD.email_code_hash
    OR NEW.email_code_expires_at IS DISTINCT FROM OLD.email_code_expires_at;
  v_revoked_now := OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL;

  IF OLD.revoked_at IS NOT NULL
     AND NEW.revoked_at IS DISTINCT FROM OLD.revoked_at THEN
    RAISE EXCEPTION 'secure share revocation cannot be cleared or rewritten'
      USING ERRCODE = '23514';
  END IF;

  IF v_revoked_now AND NEW.revoked_at > statement_timestamp() THEN
    RAISE EXCEPTION 'secure share revocation cannot be future dated'
      USING ERRCODE = '23514';
  END IF;

  IF v_code_rotated THEN
    IF OLD.revoked_at IS NOT NULL
       OR OLD.expires_at <= statement_timestamp() THEN
      RAISE EXCEPTION 'secure share code cannot rotate after revoke or expiry'
        USING ERRCODE = '23514';
    END IF;
    IF v_revoked_now THEN
      RAISE EXCEPTION 'secure share code rotation and revocation must be separate transitions'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.email_code_hash IS NULL
       OR NEW.email_code_expires_at IS NULL
       OR NEW.email_code_expires_at <= statement_timestamp() THEN
      RAISE EXCEPTION 'secure share rotated code must have a future expiry'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_share_link_update_guard
  BEFORE UPDATE ON placement_tpo_share_links
  FOR EACH ROW EXECUTE FUNCTION db09_restrict_share_link_update();
--> statement-breakpoint
CREATE FUNCTION db09_assert_tpo_user_state_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT db09_has_active_tpo_actor(NEW.user_id,NEW.college_id) THEN
    RAISE EXCEPTION 'TPO user-scoped record belongs to user without TPO scope'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_tpo_user_preferences_scope_guard
  BEFORE INSERT OR UPDATE
  ON placement_tpo_user_preferences
  FOR EACH ROW EXECUTE FUNCTION db09_assert_tpo_user_state_scope();
--> statement-breakpoint
CREATE TRIGGER db09_tpo_saved_views_scope_guard
  BEFORE INSERT OR UPDATE OF college_id,user_id
  ON placement_tpo_saved_views
  FOR EACH ROW EXECUTE FUNCTION db09_assert_tpo_user_state_scope();
--> statement-breakpoint
CREATE FUNCTION db09_restrict_tpo_user_preferences_lifecycle() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'TPO user preference record cannot be deleted'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.updated_at > statement_timestamp() THEN
      RAISE EXCEPTION 'TPO preference creation timestamp must not be future dated'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.college_id IS DISTINCT FROM OLD.college_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'TPO preference owner identity cannot be changed'
      USING ERRCODE = '23514';
  END IF;

  -- A prior DB-owned monotonic microsecond tick can be slightly ahead of
  -- this statement clock. Reject only a *newly supplied* future timestamp;
  -- preserving OLD.updated_at on the incoming row is not timestamp forgery.
  IF NEW.updated_at IS DISTINCT FROM OLD.updated_at
     AND NEW.updated_at > statement_timestamp() THEN
    RAISE EXCEPTION 'TPO preference timestamp must not be future dated'
      USING ERRCODE = '23514';
  END IF;

  IF ROW(
    NEW.morning_digest, NEW.recruiter_messages, NEW.requests,
    NEW.results_ready, NEW.follow_ups
  ) IS DISTINCT FROM ROW(
    OLD.morning_digest, OLD.recruiter_messages, OLD.requests,
    OLD.results_ready, OLD.follow_ups
  ) THEN
    -- The monotonic microsecond avoids losing a change in a tight update
    -- loop, even where transaction_timestamp() is unchanged.
    NEW.updated_at := GREATEST(
      clock_timestamp(), OLD.updated_at + interval '1 microsecond'
    );
  ELSE
    NEW.updated_at := OLD.updated_at;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_tpo_user_preferences_lifecycle_guard
  BEFORE INSERT OR UPDATE OR DELETE
  ON placement_tpo_user_preferences
  FOR EACH ROW EXECUTE FUNCTION db09_restrict_tpo_user_preferences_lifecycle();
--> statement-breakpoint
CREATE FUNCTION db09_restrict_tpo_saved_view_lifecycle() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at > statement_timestamp() THEN
      RAISE EXCEPTION 'TPO saved view timestamp must not be future dated'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'TPO saved views are immutable after creation'
    USING ERRCODE = '23514';
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_tpo_saved_views_lifecycle_guard
  BEFORE INSERT OR UPDATE
  ON placement_tpo_saved_views
  FOR EACH ROW EXECUTE FUNCTION db09_restrict_tpo_saved_view_lifecycle();
--> statement-breakpoint
CREATE FUNCTION db09_assert_student_note_principals() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM college_memberships m
      JOIN membership_roles r ON r.membership_id = m.id
     WHERE m.id = NEW.learner_membership_id
       AND m.college_id = NEW.college_id
       AND m.status = 'ACTIVE'
       AND r.role = 'LEARNER'
  ) THEN
    RAISE EXCEPTION 'student note learner is not active in note college'
      USING ERRCODE = '23514';
  END IF;
  IF NOT db09_has_active_tpo_actor(
    NEW.created_by_user_id,
    NEW.college_id
  ) THEN
    RAISE EXCEPTION 'student note author lacks active TPO scope in note college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_student_note_principal_scope_guard
  BEFORE INSERT OR UPDATE OF
    college_id,learner_membership_id,created_by_user_id
  ON placement_tpo_student_notes
  FOR EACH ROW EXECUTE FUNCTION db09_assert_student_note_principals();
--> statement-breakpoint
CREATE FUNCTION db09_restrict_student_note_history() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at > statement_timestamp() + interval '5 minutes' THEN
      RAISE EXCEPTION 'TPO student note creation timestamp is unreasonably future dated'
        USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'TPO student note history is append-only'
    USING ERRCODE = '23514';
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_student_note_history_guard
  BEFORE INSERT OR UPDATE OR DELETE ON placement_tpo_student_notes
  FOR EACH ROW EXECUTE FUNCTION db09_restrict_student_note_history();
--> statement-breakpoint
CREATE FUNCTION db09_assert_team_member_principal_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM college_memberships m
      JOIN membership_roles r ON r.membership_id = m.id
     WHERE m.id = NEW.membership_id
       AND m.college_id = NEW.college_id
       AND m.status = 'ACTIVE'
       AND r.role IN ('FACULTY','COLLEGE_ADMIN','TPO')
  ) THEN
    RAISE EXCEPTION 'TPO team member is not active staff in team college'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_team_member_principal_scope_guard
  BEFORE INSERT OR UPDATE OF college_id,membership_id,role
  ON placement_tpo_team_members
  FOR EACH ROW EXECUTE FUNCTION db09_assert_team_member_principal_scope();
--> statement-breakpoint
CREATE FUNCTION db09_reject_share_event_rewrite() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'share event history is append-only'
    USING ERRCODE = '23514';
END $$;
--> statement-breakpoint
CREATE TRIGGER db09_share_event_immutable
  BEFORE UPDATE OR DELETE ON placement_tpo_share_events
  FOR EACH ROW EXECUTE FUNCTION db09_reject_share_event_rewrite();
--> statement-breakpoint
CREATE FUNCTION db09_assert_share_link_event_completeness() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM placement_tpo_share_events e
     WHERE e.share_id = NEW.id
       AND e.action = 'CREATED'
  ) THEN
    RAISE EXCEPTION 'secure share is missing CREATED lifecycle event'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.revoked_at IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
         FROM placement_tpo_share_events e
        WHERE e.share_id = NEW.id
          AND e.action = 'REVOKED'
     ) THEN
    RAISE EXCEPTION 'revoked secure share is missing REVOKED lifecycle event'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER db09_share_link_event_completeness_guard
  AFTER INSERT OR UPDATE ON placement_tpo_share_links
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION db09_assert_share_link_event_completeness();
--> statement-breakpoint
CREATE FUNCTION db09_assert_share_event_state() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_created_at timestamptz;
  v_expires_at timestamptz;
  v_revoked_at timestamptz;
BEGIN
  SELECT s.created_at,s.expires_at,s.revoked_at
    INTO v_created_at,v_expires_at,v_revoked_at
    FROM placement_tpo_share_links s
   WHERE s.id = NEW.share_id;

  IF v_created_at IS NULL THEN
    RAISE EXCEPTION 'secure share lifecycle event has no share'
      USING ERRCODE = '23503';
  END IF;

  IF NEW.created_at < v_created_at THEN
    RAISE EXCEPTION 'secure share event predates share creation'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.action = 'REVOKED' THEN
    IF v_revoked_at IS NULL THEN
      RAISE EXCEPTION 'secure share REVOKED event requires revoked share state'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.created_at < v_revoked_at THEN
      RAISE EXCEPTION 'secure share REVOKED event predates revocation'
        USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.action IN (
    'OPENED','DOWNLOADED_LIST','DOWNLOADED_ZIP','LINK_EMAILED','CODE_EMAILED'
  ) THEN
    IF v_revoked_at IS NOT NULL THEN
      RAISE EXCEPTION 'secure share use/delivery event cannot be appended after revocation'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.created_at >= v_expires_at THEN
      RAISE EXCEPTION 'secure share use/delivery event cannot be appended after expiry'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER db09_share_event_state_guard
  AFTER INSERT ON placement_tpo_share_events
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION db09_assert_share_event_state();

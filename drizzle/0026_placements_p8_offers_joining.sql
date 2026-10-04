CREATE TABLE "placement_offers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "version" integer NOT NULL,
  "status" varchar(24) DEFAULT 'ISSUED' NOT NULL,
  "role_title" text NOT NULL,
  "annual_ctc_inr" integer,
  "joining_date" date,
  "expires_at" timestamp with time zone,
  "issued_by_user_id" uuid NOT NULL,
  "issued_at" timestamp with time zone DEFAULT now() NOT NULL,
  "responded_by_user_id" uuid,
  "responded_at" timestamp with time zone,
  "withdrawn_by_user_id" uuid,
  "withdrawn_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_offers_version_ck" CHECK ("placement_offers"."version" > 0),
  CONSTRAINT "placement_offers_status_ck" CHECK ("placement_offers"."status" in ('ISSUED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN')),
  CONSTRAINT "placement_offers_role_title_ck" CHECK (length(trim("placement_offers"."role_title")) > 0),
  CONSTRAINT "placement_offers_ctc_ck" CHECK ("placement_offers"."annual_ctc_inr" is null or "placement_offers"."annual_ctc_inr" >= 0),
  CONSTRAINT "placement_offers_expiry_ck" CHECK ("placement_offers"."expires_at" is null or "placement_offers"."expires_at" > "placement_offers"."issued_at"),
  CONSTRAINT "placement_offers_lifecycle_ck" CHECK (("placement_offers"."status" = 'ISSUED'
          and "placement_offers"."responded_by_user_id" is null
          and "placement_offers"."responded_at" is null
          and "placement_offers"."withdrawn_by_user_id" is null
          and "placement_offers"."withdrawn_at" is null)
        or ("placement_offers"."status" in ('ACCEPTED', 'DECLINED')
          and "placement_offers"."responded_by_user_id" is not null
          and "placement_offers"."responded_at" is not null
          and "placement_offers"."withdrawn_by_user_id" is null
          and "placement_offers"."withdrawn_at" is null)
        or ("placement_offers"."status" = 'WITHDRAWN'
          and "placement_offers"."withdrawn_by_user_id" is not null
          and "placement_offers"."withdrawn_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "placement_offer_status_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "offer_id" uuid NOT NULL,
  "from_status" varchar(24),
  "to_status" varchar(24) NOT NULL,
  "actor_user_id" uuid NOT NULL,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_offer_status_history_status_ck" CHECK (("placement_offer_status_history"."from_status" is null or "placement_offer_status_history"."from_status" in ('ISSUED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'))
        and "placement_offer_status_history"."to_status" in ('ISSUED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN')),
  CONSTRAINT "placement_offer_status_history_transition_ck" CHECK (("placement_offer_status_history"."from_status" is null and "placement_offer_status_history"."to_status" = 'ISSUED')
        or ("placement_offer_status_history"."from_status" = 'ISSUED' and "placement_offer_status_history"."to_status" in ('ACCEPTED', 'DECLINED', 'WITHDRAWN'))
        or ("placement_offer_status_history"."from_status" = 'ACCEPTED' and "placement_offer_status_history"."to_status" = 'WITHDRAWN'))
);
--> statement-breakpoint
CREATE TABLE "placement_joining_outcomes" (
  "offer_id" uuid PRIMARY KEY NOT NULL,
  "status" varchar(24) DEFAULT 'PENDING' NOT NULL,
  "joining_date" date,
  "reason" text,
  "recorded_by_user_id" uuid,
  "recorded_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_joining_outcomes_status_ck" CHECK ("placement_joining_outcomes"."status" in ('PENDING', 'JOINED', 'DID_NOT_JOIN', 'DEFERRED')),
  CONSTRAINT "placement_joining_outcomes_shape_ck" CHECK (("placement_joining_outcomes"."status" = 'PENDING'
          and "placement_joining_outcomes"."joining_date" is null
          and "placement_joining_outcomes"."reason" is null
          and "placement_joining_outcomes"."recorded_by_user_id" is null
          and "placement_joining_outcomes"."recorded_at" is null)
        or ("placement_joining_outcomes"."status" = 'JOINED'
          and "placement_joining_outcomes"."joining_date" is not null
          and "placement_joining_outcomes"."recorded_by_user_id" is not null
          and "placement_joining_outcomes"."recorded_at" is not null)
        or ("placement_joining_outcomes"."status" = 'DID_NOT_JOIN'
          and coalesce(length(trim("placement_joining_outcomes"."reason")), 0) > 0
          and "placement_joining_outcomes"."recorded_by_user_id" is not null
          and "placement_joining_outcomes"."recorded_at" is not null)
        or ("placement_joining_outcomes"."status" = 'DEFERRED'
          and "placement_joining_outcomes"."joining_date" is not null
          and coalesce(length(trim("placement_joining_outcomes"."reason")), 0) > 0
          and "placement_joining_outcomes"."recorded_by_user_id" is not null
          and "placement_joining_outcomes"."recorded_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "placement_joining_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "offer_id" uuid NOT NULL,
  "from_status" varchar(24) NOT NULL,
  "to_status" varchar(24) NOT NULL,
  "joining_date" date,
  "reason" text,
  "actor_user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "placement_joining_history_status_ck" CHECK ("placement_joining_history"."from_status" in ('PENDING', 'JOINED', 'DID_NOT_JOIN', 'DEFERRED')
        and "placement_joining_history"."to_status" in ('JOINED', 'DID_NOT_JOIN', 'DEFERRED'))
);
--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_application_id_placement_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."placement_applications"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_issued_by_user_id_users_id_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_responded_by_user_id_users_id_fk" FOREIGN KEY ("responded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_withdrawn_by_user_id_users_id_fk" FOREIGN KEY ("withdrawn_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_offer_status_history" ADD CONSTRAINT "placement_offer_status_history_offer_id_placement_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."placement_offers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_offer_status_history" ADD CONSTRAINT "placement_offer_status_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_joining_outcomes" ADD CONSTRAINT "placement_joining_outcomes_offer_id_placement_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."placement_offers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_joining_outcomes" ADD CONSTRAINT "placement_joining_outcomes_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_joining_history" ADD CONSTRAINT "placement_joining_history_offer_id_placement_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."placement_offers"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "placement_joining_history" ADD CONSTRAINT "placement_joining_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_offers_application_version_uq" ON "placement_offers" USING btree ("application_id","version");
--> statement-breakpoint
CREATE UNIQUE INDEX "placement_offers_active_application_uq" ON "placement_offers" USING btree ("application_id") WHERE "placement_offers"."status" in ('ISSUED', 'ACCEPTED');
--> statement-breakpoint
CREATE INDEX "placement_offers_application_status_idx" ON "placement_offers" USING btree ("application_id","status");
--> statement-breakpoint
CREATE INDEX "placement_offer_status_history_offer_idx" ON "placement_offer_status_history" USING btree ("offer_id","created_at");
--> statement-breakpoint
CREATE INDEX "placement_joining_outcomes_status_idx" ON "placement_joining_outcomes" USING btree ("status","updated_at");
--> statement-breakpoint
CREATE INDEX "placement_joining_history_offer_idx" ON "placement_joining_history" USING btree ("offer_id","created_at");

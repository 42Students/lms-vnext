CREATE TABLE "platform_broadcast_targets" (
	"broadcast_id" uuid NOT NULL,
	"college_id" uuid NOT NULL,
	CONSTRAINT "platform_broadcast_targets_broadcast_id_college_id_pk" PRIMARY KEY("broadcast_id","college_id")
);
--> statement-breakpoint
CREATE TABLE "platform_broadcasts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"link_url" varchar(2048),
	"is_pinned" boolean DEFAULT false NOT NULL,
	"show_until" timestamp with time zone NOT NULL,
	"audience_mode" varchar(24) NOT NULL,
	"status" varchar(16) NOT NULL,
	"author_user_id" uuid NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_broadcasts_audience_mode_ck" CHECK ("platform_broadcasts"."audience_mode" in ('ALL_COLLEGES', 'SELECTED_COLLEGES')),
	CONSTRAINT "platform_broadcasts_status_ck" CHECK ("platform_broadcasts"."status" in ('DRAFT', 'PUBLISHED', 'CANCELLED')),
	CONSTRAINT "platform_broadcasts_version_ck" CHECK ("platform_broadcasts"."version" >= 0)
);
--> statement-breakpoint
ALTER TABLE "platform_broadcast_targets" ADD CONSTRAINT "platform_broadcast_targets_broadcast_id_platform_broadcasts_id_fk" FOREIGN KEY ("broadcast_id") REFERENCES "public"."platform_broadcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_broadcast_targets" ADD CONSTRAINT "platform_broadcast_targets_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_broadcasts" ADD CONSTRAINT "platform_broadcasts_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_broadcasts_created_at" ON "platform_broadcasts" USING btree ("created_at");
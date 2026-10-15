CREATE TABLE "placement_public_page_settings" (
	"college_id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"placed_count" integer,
	"offer_count" integer,
	"employer_count" integer,
	"population_count" integer,
	"published_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_public_stats_nonnegative" CHECK (("placement_public_page_settings"."placed_count" IS NULL OR "placement_public_page_settings"."placed_count" >= 0) AND ("placement_public_page_settings"."offer_count" IS NULL OR "placement_public_page_settings"."offer_count" >= 0) AND ("placement_public_page_settings"."employer_count" IS NULL OR "placement_public_page_settings"."employer_count" >= 0) AND ("placement_public_page_settings"."population_count" IS NULL OR "placement_public_page_settings"."population_count" >= 0)),
	CONSTRAINT "placement_public_population_guard" CHECK ("placement_public_page_settings"."placed_count" IS NULL OR "placement_public_page_settings"."population_count" IS NULL OR "placement_public_page_settings"."placed_count" <= "placement_public_page_settings"."population_count")
);
--> statement-breakpoint
ALTER TABLE "placement_public_page_settings" ADD CONSTRAINT "placement_public_page_settings_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
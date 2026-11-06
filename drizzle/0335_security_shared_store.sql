CREATE TABLE "security_shared_store" (
	"key" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "security_shared_store_expires_idx" ON "security_shared_store" USING btree ("expires_at");
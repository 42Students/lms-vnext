CREATE TABLE "college_signin_policies" (
	"college_id" uuid PRIMARY KEY NOT NULL,
	"method" varchar(32) NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "college_signin_policies_method_ck" CHECK ("college_signin_policies"."method" in ('EMAIL_AND_PHONE', 'PHONE_AND_EMAIL', 'EMAIL_ONLY', 'PHONE_ONLY')),
	CONSTRAINT "college_signin_policies_version_ck" CHECK ("college_signin_policies"."version" >= 0)
);
--> statement-breakpoint
ALTER TABLE "college_signin_policies" ADD CONSTRAINT "college_signin_policies_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE restrict ON UPDATE no action;
CREATE TABLE "placement_recruiter_public_contacts" (
	"recruiter_user_id" uuid PRIMARY KEY NOT NULL,
	"phone_digits" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_recruiter_contact_phone_ck" CHECK ("placement_recruiter_public_contacts"."phone_digits" ~ '^[0-9]{10}$')
);
--> statement-breakpoint
ALTER TABLE "placement_recruiter_public_contacts" ADD CONSTRAINT "placement_recruiter_public_contacts_recruiter_user_id_users_id_fk" FOREIGN KEY ("recruiter_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
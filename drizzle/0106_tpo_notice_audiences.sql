CREATE TABLE "placement_tpo_notice_audiences" (
	"announcement_id" uuid PRIMARY KEY NOT NULL,
	"kind" varchar(24) NOT NULL,
	CONSTRAINT "tpo_notice_audience_kind_ck" CHECK ("placement_tpo_notice_audiences"."kind" IN ('COLLEGE','PLACEMENTS','BATCHES','BRANCHES','DRIVE'))
);
--> statement-breakpoint
CREATE TABLE "placement_tpo_notice_recipients" (
	"announcement_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	CONSTRAINT "placement_tpo_notice_recipients_announcement_id_membership_id_pk" PRIMARY KEY("announcement_id","membership_id")
);
--> statement-breakpoint
ALTER TABLE "placement_tpo_notice_audiences" ADD CONSTRAINT "placement_tpo_notice_audiences_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_notice_recipients" ADD CONSTRAINT "placement_tpo_notice_recipients_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_tpo_notice_recipients" ADD CONSTRAINT "placement_tpo_notice_recipients_membership_id_college_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."college_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE FUNCTION "placement_tpo_notice_recipient_college_guard"() RETURNS trigger AS $$
BEGIN
  IF (SELECT a."college_id" FROM "announcements" a WHERE a."id" = NEW."announcement_id")
     IS DISTINCT FROM
     (SELECT m."college_id" FROM "college_memberships" m WHERE m."id" = NEW."membership_id") THEN
    RAISE EXCEPTION 'notice recipient membership must belong to the announcement college';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "placement_tpo_notice_recipient_college_trg"
  BEFORE INSERT OR UPDATE ON "placement_tpo_notice_recipients"
  FOR EACH ROW EXECUTE FUNCTION "placement_tpo_notice_recipient_college_guard"();

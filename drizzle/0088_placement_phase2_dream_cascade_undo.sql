ALTER TABLE "placement_application_status_history" DROP CONSTRAINT "placement_application_status_history_transition_ck";--> statement-breakpoint
ALTER TABLE "placement_offer_status_history" DROP CONSTRAINT "placement_offer_status_history_transition_ck";--> statement-breakpoint
ALTER TABLE "placement_application_status_history" ADD COLUMN "cascade_id" uuid;--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD COLUMN "is_dream" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "placement_offer_status_history" ADD COLUMN "cascade_id" uuid;--> statement-breakpoint
CREATE INDEX "placement_application_history_cascade_id_idx" ON "placement_application_status_history" USING btree ("cascade_id") WHERE "placement_application_status_history"."cascade_id" is not null;--> statement-breakpoint
CREATE INDEX "placement_offer_history_cascade_id_idx" ON "placement_offer_status_history" USING btree ("cascade_id") WHERE "placement_offer_status_history"."cascade_id" is not null;--> statement-breakpoint
ALTER TABLE "placement_application_status_history" ADD CONSTRAINT "placement_application_status_history_transition_ck" CHECK (("placement_application_status_history"."from_status" is null and "placement_application_status_history"."to_status" = 'SUBMITTED')
        or ("placement_application_status_history"."from_status" = 'SUBMITTED' and "placement_application_status_history"."to_status" = 'WITHDRAWN')
        or ("placement_application_status_history"."from_status" = 'WITHDRAWN' and "placement_application_status_history"."to_status" = 'SUBMITTED'));--> statement-breakpoint
ALTER TABLE "placement_offer_status_history" ADD CONSTRAINT "placement_offer_status_history_transition_ck" CHECK (("placement_offer_status_history"."from_status" is null and "placement_offer_status_history"."to_status" = 'ISSUED')
        or ("placement_offer_status_history"."from_status" = 'ISSUED' and "placement_offer_status_history"."to_status" in ('ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'))
        or ("placement_offer_status_history"."from_status" = 'ACCEPTED' and "placement_offer_status_history"."to_status" in ('WITHDRAWN', 'ISSUED'))
        or ("placement_offer_status_history"."from_status" = 'DECLINED' and "placement_offer_status_history"."to_status" = 'ISSUED'));
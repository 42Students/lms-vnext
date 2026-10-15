ALTER TABLE "placement_jobs" DROP CONSTRAINT "placement_jobs_status_ck";--> statement-breakpoint
ALTER TABLE "placement_jobs" DROP CONSTRAINT "placement_jobs_lifecycle_ck";--> statement-breakpoint
ALTER TABLE "placement_offer_status_history" DROP CONSTRAINT "placement_offer_status_history_status_ck";--> statement-breakpoint
ALTER TABLE "placement_offer_status_history" DROP CONSTRAINT "placement_offer_status_history_transition_ck";--> statement-breakpoint
ALTER TABLE "placement_offers" DROP CONSTRAINT "placement_offers_status_ck";--> statement-breakpoint
ALTER TABLE "placement_offers" DROP CONSTRAINT "placement_offers_lifecycle_ck";--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD CONSTRAINT "placement_jobs_status_ck" CHECK ("placement_jobs"."status" in ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED', 'CANCELLED'));--> statement-breakpoint
ALTER TABLE "placement_jobs" ADD CONSTRAINT "placement_jobs_lifecycle_ck" CHECK (("placement_jobs"."status" = 'DRAFT' and "placement_jobs"."published_at" is null and "placement_jobs"."closed_at" is null and "placement_jobs"."archived_at" is null)
        or ("placement_jobs"."status" = 'PUBLISHED' and "placement_jobs"."published_at" is not null and "placement_jobs"."closed_at" is null and "placement_jobs"."archived_at" is null)
        or ("placement_jobs"."status" = 'CLOSED' and "placement_jobs"."published_at" is not null and "placement_jobs"."closed_at" is not null and "placement_jobs"."archived_at" is null)
        or ("placement_jobs"."status" = 'CANCELLED' and "placement_jobs"."published_at" is not null and "placement_jobs"."closed_at" is not null and "placement_jobs"."archived_at" is null)
        or ("placement_jobs"."status" = 'ARCHIVED' and "placement_jobs"."archived_at" is not null));--> statement-breakpoint
ALTER TABLE "placement_offer_status_history" ADD CONSTRAINT "placement_offer_status_history_status_ck" CHECK (("placement_offer_status_history"."from_status" is null or "placement_offer_status_history"."from_status" in ('ISSUED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'))
        and "placement_offer_status_history"."to_status" in ('ISSUED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'));--> statement-breakpoint
ALTER TABLE "placement_offer_status_history" ADD CONSTRAINT "placement_offer_status_history_transition_ck" CHECK (("placement_offer_status_history"."from_status" is null and "placement_offer_status_history"."to_status" = 'ISSUED')
        or ("placement_offer_status_history"."from_status" = 'ISSUED' and "placement_offer_status_history"."to_status" in ('ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'))
        or ("placement_offer_status_history"."from_status" = 'ACCEPTED' and "placement_offer_status_history"."to_status" = 'WITHDRAWN'));--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_status_ck" CHECK ("placement_offers"."status" in ('ISSUED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'));--> statement-breakpoint
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_lifecycle_ck" CHECK (("placement_offers"."status" in ('ISSUED', 'EXPIRED')
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
          and "placement_offers"."withdrawn_at" is not null));
ALTER TABLE "placement_application_screening_history" DROP CONSTRAINT "placement_application_screening_history_status_ck";--> statement-breakpoint
ALTER TABLE "placement_application_screening_history" DROP CONSTRAINT "placement_application_screening_history_transition_ck";--> statement-breakpoint
ALTER TABLE "placement_application_screening_history" ADD CONSTRAINT "placement_application_screening_history_status_ck" CHECK ("placement_application_screening_history"."from_status" in ('PENDING', 'HOLD', 'SHORTLISTED', 'REJECTED')
        and "placement_application_screening_history"."to_status" in ('PENDING', 'HOLD', 'SHORTLISTED', 'REJECTED'));--> statement-breakpoint
ALTER TABLE "placement_application_screening_history" ADD CONSTRAINT "placement_application_screening_history_transition_ck" CHECK (("placement_application_screening_history"."from_status" = 'PENDING'
          and "placement_application_screening_history"."to_status" in ('HOLD', 'SHORTLISTED', 'REJECTED'))
        or ("placement_application_screening_history"."from_status" = 'HOLD'
          and "placement_application_screening_history"."to_status" in ('SHORTLISTED', 'REJECTED'))
        or ("placement_application_screening_history"."from_status" = 'REJECTED'
          and "placement_application_screening_history"."to_status" = 'PENDING'));
-- COL-placements-01: a College Admin must be able to reject an application that was
-- already shortlisted (legacy "Mark Failed" after Assessment/Interview). The screening
-- history transition check only allowed PENDING/HOLD -> decision and REJECTED -> PENDING.
-- Adds SHORTLISTED -> REJECTED. Must match src/db/schema/placements.ts exactly.
ALTER TABLE "placement_application_screening_history" DROP CONSTRAINT IF EXISTS "placement_application_screening_history_transition_ck";--> statement-breakpoint
ALTER TABLE "placement_application_screening_history" ADD CONSTRAINT "placement_application_screening_history_transition_ck" CHECK (("placement_application_screening_history"."from_status" = 'PENDING'
          and "placement_application_screening_history"."to_status" in ('HOLD', 'SHORTLISTED', 'REJECTED'))
        or ("placement_application_screening_history"."from_status" = 'HOLD'
          and "placement_application_screening_history"."to_status" in ('SHORTLISTED', 'REJECTED'))
        or ("placement_application_screening_history"."from_status" = 'SHORTLISTED'
          and "placement_application_screening_history"."to_status" = 'REJECTED')
        or ("placement_application_screening_history"."from_status" = 'REJECTED'
          and "placement_application_screening_history"."to_status" = 'PENDING'));

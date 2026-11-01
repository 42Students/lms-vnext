-- DB-019 DB08 source fidelity: the old placement_registration outcome label
-- and detail are a staff-authored after-college destination, NOT new learner
-- consent. The separate placement_tpo_after_college record is the vNext home.
-- Both fields are nullable; the existing rows retain their outcome unchanged.
ALTER TABLE "placement_tpo_after_college" ADD COLUMN "outcome_label" varchar(60);
--> statement-breakpoint
ALTER TABLE "placement_tpo_after_college" ADD COLUMN "outcome_detail" varchar(200);

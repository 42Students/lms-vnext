-- PROPOSAL ONLY — TPO-drive-workspace-53. Orchestrator registers a numbered migration.
-- One recorded seat can be offered to one waitlisted applicant; retry uses the same row.
CREATE TABLE IF NOT EXISTS placement_waitlist_promotions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 job_id uuid NOT NULL REFERENCES placement_jobs(id),
 round_id uuid NOT NULL REFERENCES placement_job_rounds(id),
 application_id uuid NOT NULL REFERENCES placement_applications(id),
 seat_number integer NOT NULL,
 waitlist_rank integer NOT NULL,
 status varchar(16) NOT NULL DEFAULT 'PENDING',
 reason text NOT NULL,
 offer_id uuid REFERENCES placement_offers(id),
 promoted_by_user_id uuid NOT NULL REFERENCES users(id),
 promoted_at timestamptz NOT NULL DEFAULT now(),
 released_at timestamptz,
 CONSTRAINT waitlist_promotion_round_job_fk FOREIGN KEY(round_id,job_id) REFERENCES placement_job_rounds(id,job_id),
 CONSTRAINT placement_waitlist_promotions_application_uq UNIQUE(application_id),
 CONSTRAINT placement_waitlist_promotions_job_seat_uq UNIQUE(job_id,seat_number),
 CONSTRAINT placement_waitlist_promotions_rank_ck CHECK(waitlist_rank>0 AND seat_number>0),
 CONSTRAINT placement_waitlist_promotions_status_ck CHECK(status IN ('PENDING','RELEASED')),
 CONSTRAINT placement_waitlist_promotions_release_ck CHECK(
  (status='PENDING' AND offer_id IS NULL AND released_at IS NULL) OR
  (status='RELEASED' AND offer_id IS NOT NULL AND released_at IS NOT NULL)),
 CONSTRAINT placement_waitlist_promotions_reason_ck CHECK(length(trim(reason))>=3)
);
CREATE INDEX IF NOT EXISTS placement_waitlist_promotions_job_status_idx
 ON placement_waitlist_promotions(job_id,status);

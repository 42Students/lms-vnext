-- LEARNER-placements-35; TPO's confirmed_at records slot assignment, not a
-- learner's own acceptance. Keep these two consent facts independent.
ALTER TABLE placement_round_candidate_slots
 ADD COLUMN IF NOT EXISTS learner_confirmed_at timestamptz;
CREATE INDEX IF NOT EXISTS prcs_learner_confirmed_at_idx
 ON placement_round_candidate_slots(application_id, round_id, learner_confirmed_at)
 WHERE status='BOOKED';

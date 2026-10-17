-- PROPOSED migration only, not yet registered.
-- Gaps TPO-students-05 TPO-settings-audit-30 TPO-students-54.
-- Keep existing records. Expand to nine legacy outcome options,
-- distinguishing automatic placement evidence from manually chosen destination.
ALTER TABLE placement_tpo_after_college
 DROP CONSTRAINT IF EXISTS placement_tpo_after_college_outcome_ck;
ALTER TABLE placement_tpo_after_college
 ADD CONSTRAINT placement_tpo_after_college_outcome_ck
 CHECK (outcome IN (
 'PLACED_ON_CAMPUS','PLACED_OFF_CAMPUS','HIGHER_STUDIES',
 'ENTREPRENEURSHIP','COMPETITIVE_EXAMS','NOT_INTERESTED',
 'LOOKING_FOR_JOB','DEBARRED','NOT_DECIDED'
 ));
-- Do not retroactively rewrite legacy higher-study/entrepreneurship rows.
-- Product service must derive automatic PLACED_* from verified placed evidence.
-- Add college-specific labels/details only after policy and schema review.

-- Every placement-cell lookup is scoped to one college (finder, students list, eligibility, journeys), and learner had no index on
-- college_id, so each of them read the whole table. Cheap now; it grows with every college onboarded.
CREATE INDEX idx_learner_college ON learner (college_id);

-- Marks as the student earned them, and one comparable percentage (TPO notes, 5 Oct 2026).
--
-- A 10th mark can be a CBSE CGPA (9.2 out of 10), a state-board percentage or a letter grade; a degree can be a CGPA out of 10
-- or 4, or a percentage. Verification used to keep only percentages for 10th and 12th, so a CBSE student's 10th was simply
-- missing and "60% throughout" treated them as not provided. Now each level keeps the mark as earned here, and tenth_pct,
-- twelfth_pct, diploma_pct and ug_pct hold the comparable percentage (converted with the college's rule when it was a CGPA).
--   marks_json: {"10TH": {"grade": "9.2", "scale": "CGPA", "max": "10"}, "12TH": {"grade": "86", "scale": "PERCENTAGE"}, ...}
ALTER TABLE learner_academic_record
    ADD COLUMN marks_json JSON NULL COMMENT 'Each level''s mark as earned (grade, scale, max); the *_pct columns hold the comparable percentage';

-- How a CGPA becomes a percentage for this college (universities publish different formulas). NULL = CGPA x 9.5.
ALTER TABLE tpo_college_settings
    ADD COLUMN cgpa_to_pct VARCHAR(20) NULL COMMENT 'X9_5 | MINUS_0_5_X10 | MINUS_0_75_X10 | X10';

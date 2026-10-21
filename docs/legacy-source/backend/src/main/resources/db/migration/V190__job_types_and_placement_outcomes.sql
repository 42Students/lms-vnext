-- Job types a college can add, and the final placement outcome (TPO notes 2026-10-04, items 15 and 7).
--
-- 1. Each drive says whether its offers count as placed. Until now only the type name decided it (an Internship offer
--    never counts); a college can now add its own types ("Part-time", "Research fellowship") and answer that question
--    for each. The drive carries the answer so every placed count, held-offer check and report reads one column.
ALTER TABLE job
    ADD COLUMN counts_as_placed TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Offers from this drive count as placed (from its job type)';
UPDATE job SET counts_as_placed = 0 WHERE job_type = 'Internship';

-- 2. The college's own job types and its own outcome labels, kept with the other placement settings.
--    job_types_json:      {"hidden": ["Contract"], "custom": [{"id": "a1b2c3", "name": "Part-time", "countsAsPlaced": false, "hidden": false}]}
--    outcome_labels_json: [{"id": "d4e5f6", "label": "Family business", "outcome": "ENTREPRENEURSHIP"}]
ALTER TABLE tpo_college_settings
    ADD COLUMN job_types_json JSON NULL COMMENT 'Hidden built-in job types and the college''s own types',
    ADD COLUMN outcome_labels_json JSON NULL COMMENT 'College labels, each mapped to one fixed placement outcome';

-- 3. The final outcome of a student who is not taking part in placements. choice already holds PLACEMENTS,
--    HIGHER_STUDIES or NOT_INTERESTED; it can now also be ENTREPRENEURSHIP or COMPETITIVE_EXAMS (set by the placement
--    cell). outcome_label is the college's own label, outcome_detail the specifics (the exam, the business).
ALTER TABLE placement_registration
    ADD COLUMN outcome_label VARCHAR(60) NULL COMMENT 'The college''s own label for this outcome, when one was picked',
    ADD COLUMN outcome_detail VARCHAR(200) NULL COMMENT 'Specifics: the exam (GATE, CAT...), the business, the university';

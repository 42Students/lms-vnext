-- Student V1 §5 "Off-campus offer": "I got an offer outside campus" with the letter -> the
-- placement cell verifies -> counted as placed under the same rules. One row per verified
-- off-campus placement; its CTC folds into PlacementCascadePolicy/PlacementRulesService's
-- held-CTC calculation exactly like an on-campus job_offer does, without inventing a fake
-- Job/JobApplication/JobOffer chain for a company that never ran a drive at this college.
CREATE TABLE external_placement (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    learner_id INT NOT NULL,
    college_id INT NOT NULL,
    request_id BIGINT NULL COMMENT 'The student_request (type EXTERNAL_OFFER) this was verified from, when there is one.',
    company_name VARCHAR(200) NOT NULL,
    ctc_lpa DECIMAL(10,2) NULL,
    letter_url VARCHAR(500) NULL,
    verified_by INT NULL,
    verified_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted TINYINT(1) NOT NULL DEFAULT 0,
    INDEX idx_external_placement_learner (learner_id, is_deleted),
    INDEX idx_external_placement_college (college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TPO V1 settings: the closed placement-rules set and "What companies see" defaults.
-- One row per college, created on first save (service creates the default row on demand).

CREATE TABLE college_placement_rules (
    college_id INT NOT NULL PRIMARY KEY,
    -- SELECTED | OFFER_RELEASED | OFFER_ACCEPTED — when a student counts as "placed" in Reports.
    counts_as_placed_at VARCHAR(20) NOT NULL DEFAULT 'OFFER_RELEASED',
    max_held_offers INT NOT NULL DEFAULT 1,
    uplift_pct INT NOT NULL DEFAULT 40 COMMENT 'A placed student may still apply if CTC is at least this much higher, or the drive is tagged Dream',
    min_response_hours INT NOT NULL DEFAULT 48,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE college_what_companies_see (
    college_id INT NOT NULL PRIMARY KEY,
    show_cgpa_exact BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'False = band only, e.g. "7.5-8.0"',
    show_tenth_twelfth BOOLEAN NOT NULL DEFAULT TRUE,
    show_project_links BOOLEAN NOT NULL DEFAULT TRUE,
    show_assessment_scores BOOLEAN NOT NULL DEFAULT FALSE,
    show_attendance BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE industry_company
    ADD COLUMN export_columns_json JSON NULL COMMENT 'Saved per-company export column picker (TPO V1)';

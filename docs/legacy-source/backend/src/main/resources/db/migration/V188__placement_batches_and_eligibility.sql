-- Batches and eligibility replace the placement season (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md).

-- Who is in placements. A decision on a batch, a class or one learner; the most specific wins (learner, class, batch).
-- No row anywhere up the chain means Not decided. Ineligible always carries a reason.
CREATE TABLE placement_eligibility (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    scope_type VARCHAR(10) NOT NULL COMMENT 'BATCH | CLASS | LEARNER',
    scope_id BIGINT NOT NULL,
    status VARCHAR(12) NOT NULL COMMENT 'ELIGIBLE | INELIGIBLE',
    reason VARCHAR(200) NULL COMMENT 'Required when INELIGIBLE',
    note VARCHAR(300) NULL,
    decided_by_type VARCHAR(20) NULL,
    decided_by_id INT NULL,
    decided_by_name VARCHAR(200) NULL,
    decided_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_placement_eligibility (scope_type, scope_id),
    INDEX idx_placement_eligibility_college (college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Every change, grouped by the action that made it (so a bulk change can be undone in one step).
CREATE TABLE placement_eligibility_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    action_id VARCHAR(36) NOT NULL COMMENT 'One bulk action = one id',
    scope_type VARCHAR(10) NOT NULL,
    scope_id BIGINT NOT NULL,
    before_status VARCHAR(12) NULL COMMENT 'NULL = Not decided at that level',
    before_reason VARCHAR(200) NULL,
    before_note VARCHAR(300) NULL,
    after_status VARCHAR(12) NULL,
    after_reason VARCHAR(200) NULL,
    after_note VARCHAR(300) NULL,
    actor_type VARCHAR(20) NULL,
    actor_id INT NULL,
    actor_name VARCHAR(200) NULL,
    undone_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_placement_eligibility_event_action (college_id, action_id),
    INDEX idx_placement_eligibility_event_scope (scope_type, scope_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- A batch's placement life: registration deadline, when it was invited, when it finished, its own rules (NULL = college rules).
-- No row = not started.
CREATE TABLE placement_batch (
    batch_id BIGINT NOT NULL PRIMARY KEY,
    college_id INT NOT NULL,
    registration_deadline DATETIME NULL,
    invited_at DATETIME NULL,
    finished_at DATETIME NULL,
    rules_json JSON NULL COMMENT 'Overrides of the college placement rules for this batch; NULL = college rules',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_placement_batch_college (college_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

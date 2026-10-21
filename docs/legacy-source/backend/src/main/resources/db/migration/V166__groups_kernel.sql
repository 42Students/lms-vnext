-- Groups kernel: a named set of people, for a purpose. See docs/groups/GROUPS-KERNEL.md.
--
-- The one rule: features point AT a group (they store a group_id); the kernel never points at
-- features and never switches on `kind`. Electives are the first feature on top of this; placements
-- and notifications adopt it later through one optional group_id column each. Existing membership
-- tables (project_member, placement_registration, ...) are NOT migrated onto this.
--
-- Additive only. No existing table is touched.

-- ---------------------------------------------------------------- group
CREATE TABLE lms_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    kind VARCHAR(40) NOT NULL COMMENT 'Feature-owned discriminator, e.g. ELECTIVE, CRT, BUS. Upper-case identifier; the kernel stores it, never interprets it',
    owner_scope VARCHAR(20) NOT NULL DEFAULT 'COLLEGE' COMMENT 'COLLEGE | PLATFORM',
    college_id INT NULL COMMENT 'NULL only for PLATFORM-owned groups (super-admin)',
    name VARCHAR(150) NOT NULL,
    description VARCHAR(1000) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT | ACTIVE | CLOSED | ARCHIVED. Self-join needs ACTIVE; admins may build a roster in DRAFT',
    capacity INT NULL COMMENT 'NULL = unlimited. Hard limit on ACTIVE members, enforced by the atomic seat claim',
    active_count INT NOT NULL DEFAULT 0 COMMENT 'Denormalised count of ACTIVE members. Seat claim = UPDATE ... WHERE active_count < capacity; reconcile endpoint recomputes it',
    self_join_open_from DATETIME NULL COMMENT 'Learners may join themselves only inside [from, until]; NULL from = self-join disabled',
    self_join_open_until DATETIME NULL,
    academic_year VARCHAR(20) NULL,
    semester_number INT NULL,
    config_json JSON NULL COMMENT 'Feature-owned settings, stored and returned opaquely. Kernel reads only allowWaitlist and allowSelfLeave',
    created_by_type VARCHAR(20) NULL,
    created_by_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_lms_group_college_kind (college_id, kind, status),
    INDEX idx_lms_group_kind (kind, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- membership
CREATE TABLE lms_group_member (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    member_type VARCHAR(20) NOT NULL DEFAULT 'LEARNER' COMMENT 'LEARNER today; FACULTY/EXTERNAL reserved',
    member_id INT NOT NULL,
    state VARCHAR(20) NOT NULL COMMENT 'REQUESTED | ACTIVE | WAITLISTED | REMOVED',
    source VARCHAR(20) NOT NULL COMMENT 'MANUAL | CSV | RULE | SELF',
    is_locked BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'An explicit admin decision: a rule re-run never overturns it, and a locked REMOVED row blocks self re-join',
    waitlist_position INT NULL,
    note VARCHAR(500) NULL,
    joined_at DATETIME NULL COMMENT 'When the member last became ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_lms_group_member (group_id, member_type, member_id),
    INDEX idx_lms_group_member_member (member_type, member_id, state),
    INDEX idx_lms_group_member_state (group_id, state, waitlist_position),
    CONSTRAINT fk_lms_group_member_group FOREIGN KEY (group_id) REFERENCES lms_group (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- membership audit (append-only)
CREATE TABLE lms_group_member_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    member_type VARCHAR(20) NOT NULL,
    member_id INT NOT NULL,
    from_state VARCHAR(20) NULL,
    to_state VARCHAR(20) NOT NULL,
    source VARCHAR(20) NOT NULL,
    actor_type VARCHAR(20) NULL COMMENT 'LEARNER | FACULTY | SUPER_ADMIN | SYSTEM',
    actor_id INT NULL,
    reason VARCHAR(500) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lms_group_member_event_group (group_id, created_at),
    INDEX idx_lms_group_member_event_member (member_type, member_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------- rule-based membership
CREATE TABLE lms_group_rule (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    criteria_json JSON NOT NULL COMMENT 'Same shape as job.eligibility_json (JobEligibility.java): branches, minCgpa, maxActiveBacklogs, passingYears, ... One evaluator serves both',
    auto_refresh BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Reserved for a scheduled re-run; V1 applies on demand',
    last_run_at DATETIME NULL,
    last_run_matched INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_lms_group_rule_group (group_id),
    CONSTRAINT fk_lms_group_rule_group FOREIGN KEY (group_id) REFERENCES lms_group (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

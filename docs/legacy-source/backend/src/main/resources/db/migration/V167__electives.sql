-- Electives on the groups kernel. See docs/groups/GROUPS-KERNEL.md and docs/groups/ELECTIVES.md.
--
-- Two ideas:
--   1. A class may declare that its roster comes from a group (class.roster_group_id). Every
--      class-keyed surface (content, quizzes, timetable, attendance, grading) keeps working
--      unchanged; only the handful of repository queries that build "the learners of a class"
--      union the group's ACTIVE members in (see RosterSql.java). Learners' own class_id is never
--      touched. This is a general primitive: CRT batches and labs can use it later.
--   2. An elective offering = a course + a group (kind ELECTIVE) + a group-backed class. Enrolment
--      IS the group membership. Slots (baskets) hold the offerings a student picks from.
--
-- Additive only.

ALTER TABLE class
    ADD COLUMN class_type VARCHAR(20) NOT NULL DEFAULT 'SECTION' COMMENT 'SECTION | GROUP_BACKED. GROUP_BACKED classes are hidden from the academic-setup lists',
    ADD COLUMN roster_group_id BIGINT NULL COMMENT 'GROUP_BACKED only: roster = ACTIVE members of this lms_group',
    ADD INDEX idx_class_type (class_type),
    ADD INDEX idx_class_roster_group (roster_group_id);

CREATE TABLE elective_slot (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    college_id INT NOT NULL,
    program_id INT NOT NULL COMMENT 'The curriculum this slot belongs to; allocation may still take learners from any program in the college',
    semester_number INT NOT NULL,
    academic_year VARCHAR(20) NULL,
    name VARCHAR(150) NOT NULL COMMENT 'e.g. Professional Elective 1',
    description VARCHAR(1000) NULL,
    credits INT NOT NULL DEFAULT 3,
    min_pick INT NOT NULL DEFAULT 1,
    max_pick INT NOT NULL DEFAULT 1 COMMENT 'How many offerings of this slot one learner may hold; enforced by ElectiveJoinPolicy',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | ARCHIVED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    INDEX idx_elective_slot_college (college_id, program_id, semester_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE elective_offering (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slot_id BIGINT NOT NULL,
    course_id INT NOT NULL,
    group_id BIGINT NOT NULL COMMENT 'lms_group of kind ELECTIVE; its ACTIVE members are the enrolled learners',
    backed_class_id INT NOT NULL COMMENT 'The GROUP_BACKED class all content/timetable/attendance is keyed on',
    capacity INT NULL COMMENT 'Mirrors lms_group.capacity for display; the group enforces it',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE | ARCHIVED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_elective_offering_group (group_id),
    UNIQUE KEY uk_elective_offering_class (backed_class_id),
    INDEX idx_elective_offering_slot (slot_id),
    INDEX idx_elective_offering_course (course_id),
    CONSTRAINT fk_elective_offering_slot FOREIGN KEY (slot_id) REFERENCES elective_slot (id),
    CONSTRAINT fk_elective_offering_group FOREIGN KEY (group_id) REFERENCES lms_group (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

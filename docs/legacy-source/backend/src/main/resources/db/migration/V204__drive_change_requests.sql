-- Recruiter phase 1, step 5 (N9, N14): change requests instead of "send back".
-- A reviewer never sends a drive back. They ask for a change on a named field: a proposed value (answered with Accept or
-- Reply) or a question (answered in one input). Both directions use the same row: the college asking the company
-- (an "institutional request") and the company asking the college (a "company request").
CREATE TABLE drive_change_request (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    college_id INT NOT NULL,
    direction VARCHAR(20) NOT NULL COMMENT 'COLLEGE_TO_COMPANY (institutional request) | COMPANY_TO_COLLEGE (company request)',
    field VARCHAR(30) NOT NULL COMMENT 'ROLE_TITLE | DESCRIPTION | LOCATION | JOB_TYPE | MODE | DEADLINE | CTC_LPA | STIPEND | MIN_CGPA | BRANCHES | OTHER',
    kind VARCHAR(10) NOT NULL COMMENT 'PROPOSE (a value to accept) | ASK (a detail to give)',
    current_value VARCHAR(2000) NULL,
    proposed_value VARCHAR(2000) NULL,
    note VARCHAR(1000) NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN | ACCEPTED | ANSWERED | REPLIED | WITHDRAWN',
    answer_value VARCHAR(2000) NULL,
    reply_text VARCHAR(1000) NULL,
    created_by_type VARCHAR(20) NOT NULL,
    created_by_id INT NULL,
    created_by_name VARCHAR(200) NULL,
    resolved_by_type VARCHAR(20) NULL,
    resolved_by_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    KEY idx_drive_change_request_job (job_id, status),
    KEY idx_drive_change_request_college (college_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- "Changes made": every institutional request on a drive in review was answered; it goes back to the top of the TPO's queue.
ALTER TABLE job ADD COLUMN changes_made_at DATETIME NULL;

-- Drives that were "sent back" stay in review, with the old note as an open request the company answers in place.
INSERT INTO drive_change_request (job_id, college_id, direction, field, kind, note, status, created_by_type, created_at)
SELECT j.id, j.college_id, 'COLLEGE_TO_COMPANY', 'OTHER', 'ASK', LEFT(COALESCE(j.sent_back_note, 'Please review the request.'), 1000), 'OPEN', 'FACULTY', NOW()
FROM job j WHERE j.lifecycle_status = 'SENT_BACK' AND j.college_id IS NOT NULL;
UPDATE job SET lifecycle_status = 'REQUEST' WHERE lifecycle_status = 'SENT_BACK';

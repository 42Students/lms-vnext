-- HR V2: a recruiter's private rating and note on an applicant while reviewing. Visible only to the
-- recruiter who wrote it: never to the placement cell, the student, or a colleague.
CREATE TABLE hr_applicant_note (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hr_user_id BIGINT NOT NULL,
    college_id INT NOT NULL,
    job_id INT NOT NULL,
    application_id INT NOT NULL,
    rating TINYINT NULL COMMENT '1 to 5',
    note VARCHAR(1000) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_hr_applicant_note (hr_user_id, application_id),
    INDEX idx_hr_applicant_note_job (hr_user_id, job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
